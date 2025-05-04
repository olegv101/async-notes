"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function NotePage() {
  const [noteContent, setNoteContent] = useState("")
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkInput, setLinkInput] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const [images, setImages] = useState<{ id: string; src: string; alt: string }[]>([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [selectedModel, setSelectedModel] = useState("claude-3.5-sonnet")
  const [availableModels] = useState(["claude-3.5-sonnet", "gpt-4o", "llama-3"])
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const linkInputRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Calculate word count
  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Focus the link input when the modal opens
  useEffect(() => {
    if (showLinkModal && linkInputRef.current) {
      linkInputRef.current.focus()
      setShowInstructions(true)
    }
  }, [showLinkModal])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+K for link modal toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()

        if (showLinkModal) {
          // If modal is already open, close it
          setShowLinkModal(false)
        } else if (textareaRef.current) {
          // If modal is closed, open it if text is selected
          const start = textareaRef.current.selectionStart
          const end = textareaRef.current.selectionEnd

          if (start !== end) {
            const selectedText = noteContent.substring(start, end)
            setSelectedText(selectedText)
            setSelectionRange({ start, end })
            setShowLinkModal(true)
          }
        }
      }

      // Escape to close modal
      if (e.key === "Escape" && showLinkModal) {
        setShowLinkModal(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [noteContent, showLinkModal])

  // Handle link insertion
  const handleInsertLink = () => {
    if (!selectionRange) return

    const { start, end } = selectionRange
    const newContent = noteContent.substring(0, start) + `[${selectedText}](${linkInput})` + noteContent.substring(end)

    setNoteContent(newContent)
    setShowLinkModal(false)
    setLinkInput("")
    setShowInstructions(true)

    // Focus back on textarea after inserting link
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        const newImage = {
          id: `img-${Date.now()}`,
          src: event.target.result,
          alt: "Uploaded image",
        }

        setImages([...images, newImage])

        // Insert image reference in text
        const imageRef = `\n![Image](${newImage.id})\n`
        const cursorPos = textareaRef.current?.selectionStart || noteContent.length
        const newContent = noteContent.substring(0, cursorPos) + imageRef + noteContent.substring(cursorPos)

        setNoteContent(newContent)
      }
    }

    reader.readAsDataURL(file)
    e.target.value = "" // Reset input
  }

  // Handle link input change
  const handleLinkInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLinkInput(e.target.value)
    if (e.target.value.length > 0 && showInstructions) {
      setShowInstructions(false)
    } else if (e.target.value.length === 0 && !showInstructions) {
      setShowInstructions(true)
    }
  }

  // Split the content for rendering with the modal in between
  const renderSplitContent = () => {
    if (!showLinkModal || !selectionRange) {
      return (
        <textarea
          ref={textareaRef}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="flex-1 w-full resize-none border-none outline-none text-gray-800 text-lg leading-relaxed font-sans"
          placeholder="Start writing... (Select text and press Cmd+K to add a link)"
          spellCheck="true"
          autoFocus
        />
      )
    }

    const beforeText = noteContent.substring(0, selectionRange.start)
    const afterText = noteContent.substring(selectionRange.end)

    return (
      <div className="flex-1 flex flex-col">
        {/* Text before selection */}
        <div className="text-gray-800 text-lg leading-relaxed font-sans whitespace-pre-wrap break-words">
          {beforeText}
        </div>

        {/* Command+K Modal - Inline */}
        <div ref={modalRef} className="my-2 bg-[#1e1e1e] border border-gray-300 text-white rounded-lg shadow-lg w-full overflow-hidden">
          <div className="p-4">
            {showInstructions && (
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-400 font-mono">New instructions... (↑ for history, @ for context / tasks)</p>
                <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            )}
            <textarea
              ref={linkInputRef}
              value={linkInput}
              onChange={handleLinkInputChange}
              className="w-full bg-transparent border-none outline-none text-white resize-none min-h-[24px]"
              placeholder={showInstructions ? "" : "Enter URL..."}
              rows={Math.max(1, linkInput.split("\n").length)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleInsertLink()
                }
              }}
            />
            <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
              <span>Esc to close</span>
              <div className="flex items-center relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="hover:text-white focus:outline-none p-2"
                    >
                      {selectedModel}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#2f2f2f] border-gray-600 text-gray-300 min-w-[150px]">
                    {availableModels.map((model) => (
                      <DropdownMenuItem
                        key={model}
                        onClick={() => {
                          setSelectedModel(model)
                        }}
                        className="text-xs hover:bg-[#4f4f4f] focus:bg-[#4f4f4f] focus:text-white cursor-pointer"
                      >
                        {model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="ml-4">⌘K to toggle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text after selection */}
        <div className="text-gray-800 text-lg leading-relaxed font-sans whitespace-pre-wrap break-words">
          {afterText}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-4 sm:px-6 md:px-8 py-6 relative">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <p className="text-xs font-mono text-gray-400">
            {noteContent.length} characters · {wordCount} words
          </p>
          <div>
            <label className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 px-2 py-1 rounded-full border border-gray-200">
              Add Context
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div ref={editorRef} className="flex-1 flex flex-col overflow-hidden">
          {renderSplitContent()}
        </div>
      </div>
    </div>
  )
}
