"use client";

import React from "react";
import { useBlogStore } from "@/stores/useBlogStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { BlogPost, BlogStatus, UserRole } from "@/types/models";
import { Check, X, MessageSquare, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentBlog, fetchBlogById, publishBlog, updateBlog, addEditorNote } = useBlogStore();

  const [selectedText, setSelectedText] = React.useState("");
  const [textPosition, setTextPosition] = React.useState({ start: 0, end: 0 });
  const [noteContent, setNoteContent] = React.useState("");
  const [showNoteDialog, setShowNoteDialog] = React.useState(false);
  const [blogId, setBlogId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get blog ID from URL or props
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setBlogId(id);
      fetchBlogById(id);
    }
  }, [fetchBlogById]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      const range = selection.getRangeAt(0);
      setTextPosition({
        start: range.startOffset,
        end: range.endOffset,
      });
      setShowNoteDialog(true);
    }
  };

  const handleAddNote = async () => {
    if (!blogId || !user || !noteContent.trim()) return;

    await addEditorNote(blogId, {
      editorId: user.id,
      editorName: user.displayName,
      content: noteContent,
      position: textPosition,
    });

    setNoteContent("");
    setShowNoteDialog(false);
    setSelectedText("");
  };

  const handlePublish = async () => {
    if (!blogId || !user) return;

    const confirm = window.confirm("Bu yazıyı yayınlamak istediğinizden emin misiniz?");
    if (confirm) {
      await publishBlog(blogId, user.id);
      alert("Blog başarıyla yayınlandı!");
      router.push("/admin");
    }
  };

  const handleReject = async () => {
    if (!blogId) return;

    const reason = window.prompt("Reddetme nedeninizi yazın:");
    if (reason) {
      await updateBlog(blogId, { status: BlogStatus.DRAFT });
      if (user) {
        await addEditorNote(blogId, {
          editorId: user.id,
          editorName: user.displayName,
          content: `RED NEDENİ: ${reason}`,
          position: { start: 0, end: 0 },
        });
      }
      alert("Blog taslak olarak işaretlendi ve yazar bilgilendirildi.");
      router.push("/admin");
    }
  };

  if (!currentBlog) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (user?.role !== UserRole.EDITOR && user?.role !== UserRole.ADMIN) {
    return <div className="p-8 text-center text-red-600">Bu sayfaya erişim yetkiniz yok.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentBlog.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Yazar: {currentBlog.authorName}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentBlog.status === BlogStatus.PENDING_REVIEW
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {currentBlog.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <X size={18} />
                Reddet
              </button>
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Check size={18} />
                Yayınla
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Eye size={20} />
                İçerik Önizleme
              </h2>

              <div
                className="prose max-w-none"
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{ __html: currentBlog.content }}
              />
            </div>

            {currentBlog.excerpt && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-blue-900 mb-2">Özet</h3>
                <p className="text-sm text-blue-800">{currentBlog.excerpt}</p>
              </div>
            )}

            {(currentBlog.tags.length > 0 || currentBlog.categories.length > 0) && (
              <div className="mt-4 flex gap-4">
                {currentBlog.tags.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-600">Etiketler:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentBlog.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editor Notes Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-lg p-4 sticky top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare size={18} />
                Editör Notları ({currentBlog.editorNotes?.length || 0})
              </h3>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {currentBlog.editorNotes?.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border ${
                      note.resolved ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {note.editorName}
                      </span>
                      {note.resolved && (
                        <span className="text-xs text-green-600 font-medium">✓ Çözüldü</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{note.content}</p>
                    {!note.resolved && blogId && (
                      <button
                        onClick={() => {
                          /* Resolve note */
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Çözüldü olarak işaretle
                      </button>
                    )}
                  </div>
                ))}

                {(!currentBlog.editorNotes || currentBlog.editorNotes.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">Henüz not yok</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600 mb-2">
                  <strong>İpucu:</strong> İçerikten metin seçerek not ekleyebilirsiniz
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Not Ekle</h3>

            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <p className="text-sm text-gray-600 mb-1">Seçili metin:</p>
              <p className="text-sm font-medium">{selectedText}</p>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Notunuzu yazın..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddNote}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Not Ekle
              </button>
              <button
                onClick={() => {
                  setShowNoteDialog(false);
                  setNoteContent("");
                  setSelectedText("");
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
