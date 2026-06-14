import { useRef, useState } from 'react'
import { IconUpload, IconPlayerPlay, IconMinus, IconPlus } from '@tabler/icons-react'
import styles from './EditorView.module.css'

interface Props {
  text: string
  words: string[]
  currentIndex: number
  wpm: number
  onTextChange: (text: string) => void
  onFileDrop: (file: File) => void
  onWpmChange: (wpm: number) => void
  onRead: () => void
  onClear: () => void
}

export function EditorView({
  text,
  words,
  currentIndex,
  wpm,
  onTextChange,
  onFileDrop,
  onWpmChange,
  onRead,
  onClear,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (_e: React.DragEvent) => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileDrop(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileDrop(file)
    e.target.value = ''
  }

  return (
    <div className={styles.editorWrap}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <span className={styles.logo}>FastRedu</span>
        <div className={styles.tabRow}>
          <div className={`${styles.tab} ${styles.tabActive}`}>Editor</div>
          <div className={styles.tab}>Ajustes</div>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.btnGhost} onClick={onClear}>
            Limpiar
          </button>
          <button className={styles.btnPrimary} onClick={onRead} disabled={!text}>
            <IconPlayerPlay size={11} />
            Leer
          </button>
        </div>
      </div>

      <div className={styles.container}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Upload zone */}
          <div
            className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>
              <IconUpload size={20} />
            </div>
            <div className={styles.uploadText}>Arrastra o haz clic para subir</div>
            <div className={styles.uploadFormats}>PDF · DOCX · TXT</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />

          {/* WPM Control */}
          <div>
            <div className={styles.sidebarSectionLabel}>Velocidad</div>
            <div className={styles.wpmControl}>
              <div>
                <div className={styles.wpmValue}>{wpm}</div>
                <div className={styles.wpmLabel}>palabras/min</div>
              </div>
              <div className={styles.wpmBtns}>
                <button
                  className={styles.wpmBtn}
                  onClick={() => onWpmChange(Math.max(100, wpm - 25))}
                >
                  <IconMinus size={12} />
                </button>
                <button
                  className={styles.wpmBtn}
                  onClick={() => onWpmChange(Math.min(1000, wpm + 25))}
                >
                  <IconPlus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          {words.length > 0 && (
            <div>
              <div className={styles.sidebarSectionLabel}>Progreso</div>
              <div className={styles.progressBarWrap}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(100, (currentIndex / Math.max(1, words.length - 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className={styles.progressMeta}>
                <span>palabra {currentIndex + 1}</span>
                <span>{words.length} total</span>
              </div>
            </div>
          )}
        </div>

        {/* Editor area */}
        <div className={styles.editorArea}>
          <textarea
            className={styles.editorTextarea}
            value={text}
            onChange={e => onTextChange(e.target.value)}
            placeholder="Pega texto aquí o sube un archivo..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Play FAB */}
      <button
        className={styles.playFab}
        onClick={onRead}
        disabled={!text}
        aria-label="Comenzar lectura RSVP"
      >
        <IconPlayerPlay size={20} />
      </button>
    </div>
  )
}