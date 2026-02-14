'use client'

import { useStore, ModelType } from '@/lib/store'

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore()

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="model-select" className="text-sm font-medium text-gray-300">
        Model:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as ModelType)}
        className="block w-full rounded-md border-gray-700 bg-gray-800 text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
      >
        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
        <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash Preview</option>
        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
      </select>
    </div>
  )
}
