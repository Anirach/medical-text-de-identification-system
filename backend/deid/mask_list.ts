import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { MaskKeyword } from "./types";

interface ListMaskKeywordsRequest {
  userId: string;
}

interface ListMaskKeywordsResponse {
  keywords: MaskKeyword[];
}

// Retrieves all custom mask keywords for a user
export const listMaskKeywords = api<ListMaskKeywordsRequest, ListMaskKeywordsResponse>(
  { expose: true, method: "GET", path: "/mask-keywords", auth: true },
  async (req) => {
    const rows = await db.queryAll<{
      id: number;
      user_id: string;
      keyword: string;
      entity_type: string;
    }>`
      SELECT id, user_id, keyword, entity_type 
      FROM mask_keywords 
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;
    
    const keywords: MaskKeyword[] = rows.map((row) => ({
      id: row.id,
      keyword: row.keyword,
      entityType: row.entity_type as any,
      userId: row.user_id,
    }));
    
    return { keywords };
  }
);

interface CreateMaskKeywordRequest {
  userId: string;
  keyword: string;
  entityType: string;
}

interface CreateMaskKeywordResponse {
  keyword: MaskKeyword;
}

// Creates a new custom mask keyword
export const createMaskKeyword = api<CreateMaskKeywordRequest, CreateMaskKeywordResponse>(
  { expose: true, method: "POST", path: "/mask-keywords", auth: true },
  async (req) => {
    if (!req.keyword || !req.entityType) {
      throw APIError.invalidArgument("keyword and entityType are required");
    }
    
    const row = await db.queryRow<{
      id: number;
    }>`
      INSERT INTO mask_keywords (user_id, keyword, entity_type)
      VALUES (${req.userId}, ${req.keyword}, ${req.entityType})
      RETURNING id
    `;
    
    if (!row) {
      throw APIError.internal("Failed to create mask keyword");
    }
    
    return {
      keyword: {
        id: row.id,
        keyword: req.keyword,
        entityType: req.entityType as any,
        userId: req.userId,
      },
    };
  }
);

interface UpdateMaskKeywordRequest {
  id: number;
  userId: string;
  keyword: string;
  entityType: string;
}

// Updates an existing custom mask keyword
export const updateMaskKeyword = api<UpdateMaskKeywordRequest, void>(
  { expose: true, method: "PUT", path: "/mask-keywords/:id", auth: true },
  async (req) => {
    await db.exec`
      UPDATE mask_keywords 
      SET keyword = ${req.keyword}, 
          entity_type = ${req.entityType},
          updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${req.userId}
    `;
  }
);

interface DeleteMaskKeywordRequest {
  id: number;
  userId: string;
}

// Deletes a custom mask keyword
export const deleteMaskKeyword = api<DeleteMaskKeywordRequest, void>(
  { expose: true, method: "DELETE", path: "/mask-keywords/:id", auth: true },
  async (req) => {
    await db.exec`
      DELETE FROM mask_keywords 
      WHERE id = ${req.id} AND user_id = ${req.userId}
    `;
  }
);
