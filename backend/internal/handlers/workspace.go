package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/runnow/api/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type WorkspaceHandler struct {
	Workspaces *mongo.Collection
	Shares     *mongo.Collection
}

func NewWorkspaceHandler(db *mongo.Database) *WorkspaceHandler {
	return &WorkspaceHandler{
		Workspaces: db.Collection("workspaces"),
		Shares:     db.Collection("shares"),
	}
}

func (h *WorkspaceHandler) Create(c *gin.Context) {
	oid := c.MustGet("userID").(primitive.ObjectID)
	var body struct {
		Title       string       `json:"title"`
		Description string       `json:"description"`
		Language    string       `json:"language"`
		Runtime     string       `json:"runtime"`
		Version     string       `json:"version"`
		Files       []models.File `json:"files"`
		EntryFile   string       `json:"entry_file"`
		IsPublic    bool         `json:"is_public"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Title == "" {
		body.Title = "Untitled workspace"
	}
	if len(body.Files) == 0 {
		body.Files = []models.File{{ID: uuid.NewString()[:8], Name: "main", Language: body.Language, Content: ""}}
	}
	for i := range body.Files {
		if body.Files[i].ID == "" {
			body.Files[i].ID = uuid.NewString()[:8]
		}
	}
	if body.EntryFile == "" && len(body.Files) > 0 {
		body.EntryFile = body.Files[0].ID
	}
	ws := models.Workspace{
		OwnerID:     oid,
		Title:       body.Title,
		Description: body.Description,
		Language:    body.Language,
		Runtime:     body.Runtime,
		Version:     body.Version,
		Files:       body.Files,
		EntryFile:   body.EntryFile,
		IsPublic:    body.IsPublic,
		ShareID:     uuid.NewString()[:8],
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := h.Workspaces.InsertOne(ctx, ws)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create workspace"})
		return
	}
	ws.ID = res.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, ws)
}

func (h *WorkspaceHandler) List(c *gin.Context) {
	oidVal, exists := c.Get("userID")
	filter := bson.M{}
	if exists {
		filter["$or"] = []bson.M{{"owner_id": oidVal}, {"is_public": true}}
	} else {
		filter["is_public"] = true
	}
	if q := c.Query("owner"); q == "me" && exists {
		filter = bson.M{"owner_id": oidVal}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	opts := options.Find().SetSort(bson.M{"updated_at": -1}).SetLimit(50)
	cursor, err := h.Workspaces.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list"})
		return
	}
	defer cursor.Close(ctx)
	var out []models.Workspace
	_ = cursor.All(ctx, &out)
	if out == nil {
		out = []models.Workspace{}
	}
	c.JSON(http.StatusOK, out)
}

func (h *WorkspaceHandler) Get(c *gin.Context) {
	idHex := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		shareRes := h.getByShareID(c, idHex)
		if shareRes {
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var ws models.Workspace
	err = h.Workspaces.FindOne(ctx, bson.M{"_id": oid}).Decode(&ws)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if !ws.IsPublic {
		uid, ok := c.Get("userID")
		if !ok || uid.(primitive.ObjectID) != ws.OwnerID {
			c.JSON(http.StatusForbidden, gin.H{"error": "private workspace"})
			return
		}
	}
	c.JSON(http.StatusOK, ws)
}

func (h *WorkspaceHandler) getByShareID(c *gin.Context, shareID string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var ws models.Workspace
	err := h.Workspaces.FindOne(ctx, bson.M{"share_id": shareID}).Decode(&ws)
	if err != nil {
		return false
	}
	c.JSON(http.StatusOK, ws)
	return true
}

func (h *WorkspaceHandler) Update(c *gin.Context) {
	oid := c.MustGet("userID").(primitive.ObjectID)
	idHex := c.Param("id")
	woid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	body["updated_at"] = time.Now()
	delete(body, "_id")
	delete(body, "id")
	delete(body, "owner_id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res := h.Workspaces.FindOneAndUpdate(ctx, bson.M{"_id": woid, "owner_id": oid}, bson.M{"$set": body}, options.FindOneAndUpdate().SetReturnDocument(options.After))
	var updated models.Workspace
	if err := res.Decode(&updated); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found or not owner"})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *WorkspaceHandler) Delete(c *gin.Context) {
	oid := c.MustGet("userID").(primitive.ObjectID)
	idHex := c.Param("id")
	woid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := h.Workspaces.DeleteOne(ctx, bson.M{"_id": woid, "owner_id": oid})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *WorkspaceHandler) Fork(c *gin.Context) {
	oid := c.MustGet("userID").(primitive.ObjectID)
	idHex := c.Param("id")
	woid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var orig models.Workspace
	if err := h.Workspaces.FindOne(ctx, bson.M{"_id": woid}).Decode(&orig); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	orig.ID = primitive.NilObjectID
	orig.OwnerID = oid
	orig.ShareID = uuid.NewString()[:8]
	orig.ForkedFrom = &woid
	orig.CreatedAt = time.Now()
	orig.UpdatedAt = time.Now()
	orig.IsPublic = false
	res, err := h.Workspaces.InsertOne(ctx, orig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fork failed"})
		return
	}
	orig.ID = res.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, orig)
}

func (h *WorkspaceHandler) Share(c *gin.Context) {
	oid := c.MustGet("userID").(primitive.ObjectID)
	idHex := c.Param("id")
	woid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var ws models.Workspace
	if err := h.Workspaces.FindOne(ctx, bson.M{"_id": woid, "owner_id": oid}).Decode(&ws); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var body struct {
		IsPublic   *bool `json:"is_public"`
		Permission string `json:"permission"`
	}
	_ = c.ShouldBindJSON(&body)
	update := bson.M{"updated_at": time.Now()}
	if body.IsPublic != nil {
		update["is_public"] = *body.IsPublic
	}
	if ws.ShareID == "" {
		update["share_id"] = uuid.NewString()[:8]
	}
	_, _ = h.Workspaces.UpdateOne(ctx, bson.M{"_id": woid}, bson.M{"$set": update})
	var updated models.Workspace
	_ = h.Workspaces.FindOne(ctx, bson.M{"_id": woid}).Decode(&updated)
	c.JSON(http.StatusOK, gin.H{
		"share_id": updated.ShareID,
		"share_url": "/s/" + updated.ShareID,
		"is_public": updated.IsPublic,
		"workspace": updated,
	})
}

func (h *WorkspaceHandler) GetByShare(c *gin.Context) {
	shareID := c.Param("shareId")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var ws models.Workspace
	if err := h.Workspaces.FindOne(ctx, bson.M{"share_id": shareID}).Decode(&ws); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "share not found"})
		return
	}
	c.JSON(http.StatusOK, ws)
}
