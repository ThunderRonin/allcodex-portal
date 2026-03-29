import { NextRequest, NextResponse } from "next/server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";
import { 
  createBranch, deleteBranch, getNote, getBranch, refreshNoteOrdering 
} from "@/lib/etapi-server";

export async function POST(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const { noteId, newParentId, index } = await req.json();

    if (!noteId || !newParentId) {
      return NextResponse.json({ error: "Missing noteId or newParentId" }, { status: 400 });
    }

    // 1. Get the note to find its current branches
    const note = await getNote(creds, noteId);
    if (!note || !note.parentBranchIds) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // 2. Determine which old branch to delete (we want a single parent hierarchy)
    // There could be multiple parents in Trilium, but for the lore tree we enforce single-parent movement.
    const parentBranchIds = note.parentBranchIds;
    let oldBranchIdToDelete: string | null = null;
    
    // Find the branch that corresponds to the old parent(s)
    for (const bId of parentBranchIds) {
      try {
        const b = await getBranch(creds, bId);
        // Only delete the branch if it's NOT the new parent
        if (b.parentNoteId !== newParentId) {
          oldBranchIdToDelete = bId;
          break;
        }
      } catch (e) {
        // ignore branch fetch errors
      }
    }

    // 3. Create the new branch under newParentId
    // If index is provided, we map it to notePosition.
    // Trilium uses 10, 20, 30... for notePosition usually, so index * 10 is acceptable
    // or we can let Trilium auto-assign by omitting notePosition, then refresh.
    const newBranch = await createBranch(creds, {
      noteId,
      parentNoteId: newParentId,
      notePosition: typeof index === 'number' ? (index + 1) * 10 : undefined
    });

    // 4. Delete the old branch
    if (oldBranchIdToDelete) {
      try {
        await deleteBranch(creds, oldBranchIdToDelete);
      } catch (e) {
        console.error("Failed to delete old branch", e);
      }
    }

    // 5. Force Trilium to fix the ordering of the new parent's children
    try {
      await refreshNoteOrdering(creds, newParentId);
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({ success: true, branch: newBranch });
  } catch (err) {
    return handleRouteError(err);
  }
}
