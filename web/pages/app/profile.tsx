import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetV1MeQuery, usePatchV1MeMutation } from "@/services/genApi";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { data: me } = useGetV1MeQuery({});
  const [updateMe, { isLoading }] = usePatchV1MeMutation();
  const [name, setName] = useState("");

  useEffect(() => {
    setName(me?.name || "");
  }, [me]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMe({ patchMeRequest: { name } }).unwrap();
  };

  return (
    <AppLayout>
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSave}>
              <div>
                <Label>Email</Label>
                <Input value={me?.email || ""} readOnly />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
