import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";

export const  ensureCorsairTenant = async (userId: string)=>{
    const result = await db.select().from(users).where(eq(users.id , userId));

    if(!result || result.length === 0) return false;

    return true

}