package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/runnow/api/internal/config"
	"github.com/runnow/api/internal/handlers"
	"github.com/runnow/api/internal/middleware"
	"github.com/runnow/api/internal/services"
	"github.com/runnow/api/internal/utils"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	utils.InitJWT(cfg.JWTSecret)

	db, err := services.ConnectMongo(cfg.MongoURI)
	if err != nil {
		log.Printf("mongo connect warning: %v (running without persistence)", err)
		db = nil
	} else {
		log.Println("connected to mongodb")
	}

	piston := services.NewPistonService(cfg.PistonURL)

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "runnow"})
	})

	var authHandler *handlers.AuthHandler
	var wsHandler *handlers.WorkspaceHandler
	if db != nil {
		authHandler = handlers.NewAuthHandler(db)
		wsHandler = handlers.NewWorkspaceHandler(db)
	} else {
		authHandler = &handlers.AuthHandler{}
		wsHandler = &handlers.WorkspaceHandler{}
	}
	execHandler := handlers.NewExecuteHandler(piston)

	api := r.Group("/api")
	{
		api.POST("/auth/register", func(c *gin.Context) {
			if db == nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
				return
			}
			authHandler.Register(c)
		})
		api.POST("/auth/login", func(c *gin.Context) {
			if db == nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
				return
			}
			authHandler.Login(c)
		})
		api.GET("/auth/github/callback", authHandler.GithubCallback)
		api.GET("/runtimes", execHandler.Runtimes)
		api.GET("/languages", execHandler.Languages)
		api.POST("/execute", execHandler.Execute)
		api.GET("/shares/:shareId", func(c *gin.Context) {
			if db == nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
				return
			}
			wsHandler.GetByShare(c)
		})

		auth := api.Group("")
		auth.Use(middleware.Auth())
		{
			auth.GET("/auth/me", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
					return
				}
				authHandler.Me(c)
			})
			auth.POST("/workspaces", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
					return
				}
				wsHandler.Create(c)
			})
			auth.GET("/workspaces", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusOK, []interface{}{})
					return
				}
				wsHandler.List(c)
			})
			auth.GET("/workspaces/:id", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
					return
				}
				wsHandler.Get(c)
			})
			auth.PUT("/workspaces/:id", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
					return
				}
				wsHandler.Update(c)
			})
			auth.DELETE("/workspaces/:id", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
					return
				}
				wsHandler.Delete(c)
			})
			auth.POST("/workspaces/:id/fork", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
					return
				}
				wsHandler.Fork(c)
			})
			auth.POST("/workspaces/:id/share", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"error": "db not available"})
					return
				}
				wsHandler.Share(c)
			})
		}

		public := api.Group("")
		public.Use(middleware.OptionalAuth())
		{
			public.GET("/public/workspaces", func(c *gin.Context) {
				if db == nil {
					c.JSON(http.StatusOK, []interface{}{})
					return
				}
				wsHandler.List(c)
			})
		}
	}

	r.GET("/s/:shareId", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/?share="+c.Param("shareId"))
	})

	log.Printf("RunNow listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
