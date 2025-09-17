package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username  string             `bson:"username" json:"username"`
	Email     string             `bson:"email" json:"email"`
	Password  string             `bson:"password,omitempty" json:"-"`
	Avatar    string             `bson:"avatar,omitempty" json:"avatar"`
	GithubID  string             `bson:"github_id,omitempty" json:"github_id"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type File struct {
	ID       string `bson:"id" json:"id"`
	Name     string `bson:"name" json:"name"`
	Language string `bson:"language" json:"language"`
	Content  string `bson:"content" json:"content"`
}

type Workspace struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OwnerID     primitive.ObjectID `bson:"owner_id" json:"owner_id"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description,omitempty" json:"description"`
	Language    string             `bson:"language" json:"language"`
	Runtime     string             `bson:"runtime" json:"runtime"`
	Version     string             `bson:"version" json:"version"`
	Files       []File             `bson:"files" json:"files"`
	EntryFile   string             `bson:"entry_file" json:"entry_file"`
	IsPublic    bool               `bson:"is_public" json:"is_public"`
	ShareID     string             `bson:"share_id,omitempty" json:"share_id"`
	ForkedFrom  *primitive.ObjectID `bson:"forked_from,omitempty" json:"forked_from"`
	Stars       int                `bson:"stars" json:"stars"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Share struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ShareID     string             `bson:"share_id" json:"share_id"`
	WorkspaceID primitive.ObjectID `bson:"workspace_id" json:"workspace_id"`
	OwnerID     primitive.ObjectID `bson:"owner_id" json:"owner_id"`
	Permission  string             `bson:"permission" json:"permission"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	ExpiresAt   *time.Time         `bson:"expires_at,omitempty" json:"expires_at"`
}

type ExecutionRequest struct {
	Language string `json:"language" binding:"required"`
	Version  string `json:"version"`
	Files    []File `json:"files" binding:"required"`
	Stdin    string `json:"stdin"`
	Args     []string `json:"args"`
	Entry    string `json:"entry"`
}

type ExecutionResult struct {
	Language string `json:"language"`
	Version  string `json:"version"`
	Run      RunOutput `json:"run"`
	Compile  *RunOutput `json:"compile,omitempty"`
}

type RunOutput struct {
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	Output   string `json:"output"`
	Code     int    `json:"code"`
	Signal   string `json:"signal"`
}

type PistonRuntime struct {
	Language string   `json:"language"`
	Version  string   `json:"version"`
	Aliases  []string `json:"aliases"`
	Runtime  string   `json:"runtime"`
}
