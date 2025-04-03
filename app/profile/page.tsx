import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-sm border">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img 
              src={user.imageUrl} 
              alt={user.firstName || "Profile"} 
              className="rounded-full w-20 h-20"
            />
            <div>
              <h2 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t mt-6">
            <h3 className="text-lg font-medium mb-2">Account Information</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {/* <span className="font-medium">User ID:</span> {user.id} */}
              <span className="font-medium">Username:</span> {user.username}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 