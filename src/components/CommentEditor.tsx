import React, { useState, useEffect, useRef } from 'react';

interface CommentEditorProps {
  initialComment: string;
  onSave: (comment: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  initialComment,
  onSave,
  onCancel,
  position,
}) => {
  const [comment, setComment] = useState(initialComment || '');
  const originalComment = useRef(initialComment || ''); // Store the true original value
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleCommentChange = (newComment: string) => {
    setComment(newComment);
    // Auto-save on change
    onSave(newComment.trim());
  };

  const handleCancel = () => {
    // Reset to the true original value and save it
    const originalValue = originalComment.current;
    setComment(originalValue);
    onSave(originalValue.trim()); // Save the original value back
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      // Save current text and close popup
      onSave(comment.trim());
      onCancel();
    }
  };

  return (
    <div className="comment-editor-overlay" onClick={handleCancel}>
      <div
        className="comment-editor-popup"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1050,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comment-editor-body">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            rows={3}
            className="form-control"
          />
        </div>
        <div className="comment-editor-footer">
          <div className="comment-editor-shortcuts">
            <b>Ctrl+Enter</b> save, <b>Escape</b> cancel
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;
