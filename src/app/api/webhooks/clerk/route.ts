import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';

export async function POST(req: Request) {
  const payload = await req.json();
  
  if (payload.type === 'user.created') {
    const { id, email_addresses } = payload.data;
    
    // Insert the Clerk user into your database immediately
    await db.insert(users).values({
      id: id, // e.g., user_2k3j4h5g...
      emailAddress: email_addresses[0].email_address,
    });

    
  }
  
  return new Response("OK", { status: 200 });
}