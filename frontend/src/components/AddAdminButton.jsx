import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import api from "../services/api";

export default function AddAdminButton({
  uid: initialUid,
  endpoint = "/api/admin/add-role",
  onSuccess,
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState(initialUid || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!uid) {
      setError("Please enter a user ID or email.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(endpoint, { uid, role: "admin" });
      setSuccessMsg("✅ Admin role granted successfully.");
      setUid("");
      setOpen(false);
        if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error("Add admin error:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        
          <Button
            aria-label="Add admin"
            disabled={disabled || loading}
            className="flex items-center gap-2"
            onClick={() => {
              setUid(initialUid || "");
              setOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Admin</span>
          </Button>
       
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grant Admin Role</DialogTitle>
          <DialogDescription>
            Provide the user's UID or email and confirm to grant the <strong>admin</strong> role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddAdmin} className="grid gap-4 py-2">
          <div className="grid gap-1">
            <Label htmlFor="uid">User UID or Email</Label>
            <Input
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="uid or email@example.com"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {successMsg && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{successMsg}</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Granting..." : "Confirm & Grant Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
