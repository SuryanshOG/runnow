package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/runnow/api/internal/utils"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header"})
			c.Abort()
			return
		}
		oid, claims, err := utils.ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}
		c.Set("userID", oid)
		c.Set("claims", claims)
		c.Next()
	}
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header != "" {
			parts := strings.SplitN(header, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				if oid, claims, err := utils.ValidateToken(parts[1]); err == nil {
					c.Set("userID", oid)
					c.Set("claims", claims)
				}
			}
		}
		c.Next()
	}
}
