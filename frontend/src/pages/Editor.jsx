import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Undo, Redo,
  Share2, Trash2, Save, ChevronLeft, Check, Highlighter
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import ShareModal from '../components/ShareModal';

export default function Editor({ onDocUpdated, onDocDeleted }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [role, setRole] = useState('view');
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  const saveTimerRef = useRef(null);
  const canEdit = role === 'owner' || role === 'edit';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editable: canEdit,
    onUpdate: () => {
      setSaved(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => autoSave(), 2000);
    },
  });

  // Load document
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getDocument(id)
      .then(data => {
        setDoc(data.document);
        setRole(data.role);
        setTitle(data.document.title);
        setShares(data.shares);
        try {
          const content = JSON.parse(data.document.content);
          editor?.commands.setContent(content);
        } catch {
          editor?.commands.setContent(data.document.content);
        }
        setSaved(true);
      })
      .catch(err => { toast(err.message, 'error'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id, editor]);

  // Update editability when role changes
  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [canEdit, editor]);

  const autoSave = useCallback(async () => {
    if (!id || !editor || !canEdit) return;
    setSaving(true);
    try {
      const content = JSON.stringify(editor.getJSON());
      await api.updateDocument(id, { content });
      setSaved(true);
      onDocUpdated?.({ id, title, content });
    } catch {/* silent */ }
    setSaving(false);
  }, [id, editor, canEdit, title, onDocUpdated]);

  const saveTitle = async () => {
    setEditingTitle(false);
    if (!title.trim()) { setTitle(doc?.title || 'Untitled'); return; }
    try {
      await api.updateDocument(id, { title: title.trim() });
      onDocUpdated?.({ id, title: title.trim() });
      toast('Renamed', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(id);
      onDocDeleted?.(id);
      navigate('/');
      toast('Document deleted', 'info');
    } catch (err) { toast(err.message, 'error'); }
  };

  const manualSave = async () => {
    if (!editor || !canEdit) return;
    setSaving(true);
    try {
      const content = JSON.stringify(editor.getJSON());
      await api.updateDocument(id, { content, title });
      setSaved(true);
      onDocUpdated?.({ id, title, content });
      toast('Saved', 'success');
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="spinner" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div style={styles.page}>
      {/* Topbar */}
      <div style={styles.topbar}>
        <div style={styles.topLeft}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')} title="Back">
            <ChevronLeft size={16} />
          </button>
          {editingTitle ? (
            <input
              className="input"
              style={styles.titleInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => e.key === 'Enter' && saveTitle()}
              autoFocus
            />
          ) : (
            <h1
              style={{ ...styles.titleDisplay, cursor: canEdit ? 'text' : 'default' }}
              onClick={() => canEdit && setEditingTitle(true)}
              title={canEdit ? 'Click to rename' : ''}
            >
              {title || 'Untitled Document'}
            </h1>
          )}
          <span className={`badge ${role === 'owner' ? 'badge-owner' : role === 'edit' ? 'badge-edit' : 'badge-view'}`}>
            {role}
          </span>
        </div>

        <div style={styles.topRight}>
          <span style={styles.saveStatus}>
            {saving
              ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving…</>
              : saved
              ? <><Check size={12} color="var(--accent)" /> Saved</>
              : 'Unsaved'
            }
          </span>
          {canEdit && (
            <button className="btn btn-secondary btn-sm" onClick={manualSave} disabled={saving}>
              <Save size={13} /> Save
            </button>
          )}
          {role === 'owner' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowShare(true)}>
              <Share2 size={13} />
              Share
              {shares.length > 0 && <span style={styles.shareBadge}>{shares.length}</span>}
            </button>
          )}
          {role === 'owner' && (
            <button className="btn btn-danger btn-sm btn-icon" onClick={handleDelete} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {canEdit && editor && (
        <div style={styles.toolbar}>
          <ToolGroup>
            <ToolBtn icon={Undo} action={() => editor.chain().focus().undo().run()} title="Undo" />
            <ToolBtn icon={Redo} action={() => editor.chain().focus().redo().run()} title="Redo" />
          </ToolGroup>
          <ToolDivider />
          <ToolGroup>
            <ToolBtn icon={Heading1} active={editor.isActive('heading', { level: 1 })} action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1" />
            <ToolBtn icon={Heading2} active={editor.isActive('heading', { level: 2 })} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2" />
            <ToolBtn icon={Heading3} active={editor.isActive('heading', { level: 3 })} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3" />
          </ToolGroup>
          <ToolDivider />
          <ToolGroup>
            <ToolBtn icon={Bold} active={editor.isActive('bold')} action={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)" />
            <ToolBtn icon={Italic} active={editor.isActive('italic')} action={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)" />
            <ToolBtn icon={UnderlineIcon} active={editor.isActive('underline')} action={() => editor.chain().focus().toggleUnderline().run()} title="Underline (⌘U)" />
            <ToolBtn icon={Strikethrough} active={editor.isActive('strike')} action={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough" />
            <ToolBtn icon={Highlighter} active={editor.isActive('highlight')} action={() => editor.chain().focus().toggleHighlight().run()} title="Highlight" />
          </ToolGroup>
          <ToolDivider />
          <ToolGroup>
            <ToolBtn icon={List} active={editor.isActive('bulletList')} action={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list" />
            <ToolBtn icon={ListOrdered} active={editor.isActive('orderedList')} action={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" />
          </ToolGroup>
          <ToolDivider />
          <ToolGroup>
            <ToolBtn icon={AlignLeft}   active={editor.isActive({ textAlign: 'left' })}   action={() => editor.chain().focus().setTextAlign('left').run()}   title="Left" />
            <ToolBtn icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} action={() => editor.chain().focus().setTextAlign('center').run()} title="Center" />
            <ToolBtn icon={AlignRight}  active={editor.isActive({ textAlign: 'right' })}  action={() => editor.chain().focus().setTextAlign('right').run()}  title="Right" />
          </ToolGroup>
        </div>
      )}

      {/* Editor area */}
      <div style={styles.editorWrap}>
        <div style={styles.editorInner}>
          <EditorContent editor={editor} style={styles.editorContent} />
        </div>
      </div>

      {showShare && (
        <ShareModal
          docId={id}
          onClose={() => setShowShare(false)}
          onSharesChanged={() => api.getDocument(id).then(d => setShares(d.shares))}
        />
      )}
    </div>
  );
}

function ToolGroup({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>{children}</div>;
}

function ToolDivider() {
  return <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />;
}

function ToolBtn({ icon: Icon, active, action, title }) {
  return (
    <button
      className="btn btn-ghost btn-icon btn-sm"
      style={{ color: active ? 'var(--accent)' : 'var(--ink-3)', background: active ? 'var(--accent-light)' : 'transparent' }}
      onMouseDown={e => { e.preventDefault(); action(); }}
      title={title}
    >
      <Icon size={15} />
    </button>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
  loading: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 52,
    borderBottom: '1px solid var(--border)',
    background: '#fff',
    gap: 12,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  titleDisplay: {
    fontSize: 15, fontWeight: 600, color: 'var(--ink)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: 300,
    padding: '2px 4px', borderRadius: 3,
    transition: 'background 0.1s',
  },
  titleInput: { maxWidth: 280, fontSize: 15, fontWeight: 600, padding: '4px 8px' },
  saveStatus: {
    fontSize: 12, color: 'var(--ink-4)',
    display: 'flex', alignItems: 'center', gap: 4,
    minWidth: 70,
  },
  shareBadge: {
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 10, padding: '0 5px', fontSize: 11,
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
    padding: '6px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--paper-2)',
  },
  editorWrap: { flex: 1, overflowY: 'auto', background: 'var(--paper)' },
  editorInner: {
    maxWidth: 780, margin: '0 auto',
    padding: '40px 60px',
    minHeight: '100%',
  },
  editorContent: { outline: 'none' },
};
