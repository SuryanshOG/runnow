package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/runnow/api/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	Users *mongo.Collection
}

func NewAuthHandler(db *mongo.Database) *AuthHandler {
	return &AuthHandler{Users: db.Collection("users")}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var body struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	count, _ := h.Users.CountDocuments(ctx, bson.M{"$or": []bson.M{{"email": body.Email}, {"username": body.Username}}})
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	user := bson.M{
		"username":   body.Username,
		"email":      body.Email,
		"password":   string(hash),
		"created_at": time.Now(),
	}
	res, err := h.Users.InsertOne(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}
	oid := res.InsertedID.(primitive.ObjectID)
	token, _ := utils.GenerateToken(oid, body.Username, body.Email)
	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{"id": oid.Hex(), "username": body.Username, "email": body.Email},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var user struct {
		ID       primitive.ObjectID `bson:"_id"`
		Username string             `bson:"username"`
		Email    string             `bson:"email"`
		Password string             `bson:"password"`
	}
	err := h.Users.FindOne(ctx, bson.M{"email": body.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, _ := utils.GenerateToken(user.ID, user.Username, user.Email)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  gin.H{"id": user.ID.Hex(), "username": user.Username, "email": user.Email},
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	oid, _ := c.Get("userID")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var user bson.M
	err := h.Users.FindOne(ctx, bson.M{"_id": oid}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	delete(user, "password")
	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) GithubCallback(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "github oauth placeholder - set GITHUB_CLIENT_ID/SECRET and implement flow"})
}
