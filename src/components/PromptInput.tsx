"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

const MAX_LENGTH = 1000;
const MIN_LENGTH = 2;

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function PromptInput({
  onSubmit,
  isLoading = false,
  placeholder = "输入你想要可视化的概念，例如：展示正弦波、解释二叉树...",
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateInput = (input: string): string | null => {
    const trimmed = input.trim();
    if (trimmed.length < MIN_LENGTH) {
      return `请输入至少 ${MIN_LENGTH} 个字符`;
    }
    if (trimmed.length > MAX_LENGTH) {
      return `输入不能超过 ${MAX_LENGTH} 个字符`;
    }
    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    
    const error = validateInput(trimmed);
    if (error) {
      setValidationError(error);
      return;
    }
    
    if (!isLoading) {
      setValidationError(null);
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Clear validation error when user starts typing
    if (validationError && newValue.trim().length >= MIN_LENGTH) {
      setValidationError(null);
    }
  };

  const charCount = value.trim().length;
  const isOverLimit = charCount > MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={`min-h-[80px] resize-none flex-1 ${
            validationError || isOverLimit ? "border-destructive" : ""
          }`}
          rows={3}
        />
        <Button
          type="submit"
          disabled={!value.trim() || isLoading || isOverLimit}
          size="icon"
          className="h-auto self-end"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">发送</span>
        </Button>
      </div>
      <div className="flex justify-between items-center text-xs">
        {validationError ? (
          <span className="text-destructive">{validationError}</span>
        ) : (
          <span className="text-muted-foreground">按 Enter 发送，Shift+Enter 换行</span>
        )}
        <span className={`${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
          {charCount}/{MAX_LENGTH}
        </span>
      </div>
    </form>
  );
}
