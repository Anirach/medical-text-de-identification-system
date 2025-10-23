import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { MaskKeyword } from "./types";

interface ListMaskKeywordsResponse {
  keywords: MaskKeyword[];
}

export const listMaskKeywords = api<void, ListMaskKeywordsResponse>(
  { expose: true, method: "GET", path: "/mask-keywords", auth: true },
  async () => {
    const auth = getAuthData();
    if (!auth) {
      return { keywords: [] };
    }
    
    const rows = await db.queryAll<{
      id: number;
      user_id: string;
      keyword: string;
      entity_type: string;
    }>`
      SELECT id, user_id, keyword, entity_type 
      FROM mask_keywords 
      WHERE user_id = ${auth.userID}
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
  keyword: string;
  entityType: string;
}

interface CreateMaskKeywordResponse {
  keyword: MaskKeyword;
}

export const createMaskKeyword = api<CreateMaskKeywordRequest, CreateMaskKeywordResponse>(
  { expose: true, method: "POST", path: "/mask-keywords", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    if (!req.keyword || !req.entityType) {
      throw APIError.invalidArgument("keyword and entityType are required");
    }
    
    const row = await db.queryRow<{
      id: number;
    }>`
      INSERT INTO mask_keywords (user_id, keyword, entity_type)
      VALUES (${auth.userID}, ${req.keyword}, ${req.entityType})
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
        userId: auth.userID,
      },
    };
  }
);

interface UpdateMaskKeywordRequest {
  id: number;
  keyword: string;
  entityType: string;
}

export const updateMaskKeyword = api<UpdateMaskKeywordRequest, void>(
  { expose: true, method: "PUT", path: "/mask-keywords/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    await db.exec`
      UPDATE mask_keywords 
      SET keyword = ${req.keyword}, 
          entity_type = ${req.entityType},
          updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;
  }
);

interface DeleteMaskKeywordRequest {
  id: number;
}

export const deleteMaskKeyword = api<DeleteMaskKeywordRequest, void>(
  { expose: true, method: "DELETE", path: "/mask-keywords/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    await db.exec`
      DELETE FROM mask_keywords 
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;
  }
);
