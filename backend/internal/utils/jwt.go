package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var jwtSecret []byte

func InitJWT(secret string) {
	jwtSecret = []byte(secret)
}

func GenerateToken(userID primitive.ObjectID, username, email string) (string, error) {
	claims := jwt.MapClaims{
		"sub":      userID.Hex(),
		"username": username,
		"email":    email,
		"exp":      time.Now().Add(72 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (primitive.ObjectID, jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return primitive.NilObjectID, nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return primitive.NilObjectID, nil, errors.New("invalid token")
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		return primitive.NilObjectID, nil, errors.New("invalid subject")
	}
	oid, err := primitive.ObjectIDFromHex(sub)
	if err != nil {
		return primitive.NilObjectID, nil, err
	}
	return oid, claims, nil
}
