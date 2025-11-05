'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

interface TodoListProps {
  initialTodos: Todo[]
  user: User
}

export default function TodoList({ initialTodos, user }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          user_id: user.id,
          completed: false,
        },
      ])
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error('Error creating todo:', error)
      alert('Error creating todo: ' + error.message)
      return
    }

    setTodos([data, ...todos])
    setTitle('')
    setDescription('')
  }

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error('Error updating todo:', error)
      alert('Error updating todo: ' + error.message)
      return
    }

    setTodos(todos.map((todo) => (todo.id === id ? data : todo)))
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    setLoading(true)
    const { error } = await supabase.from('todos').delete().eq('id', id)

    setLoading(false)

    if (error) {
      console.error('Error deleting todo:', error)
      alert('Error deleting todo: ' + error.message)
      return
    }

    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const handleToggleComplete = async (id: string, completed: boolean) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .update({ completed: !completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error('Error toggling todo:', error)
      return
    }

    setTodos(todos.map((todo) => (todo.id === id ? data : todo)))
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Todo</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter todo title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              placeholder="Enter todo description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Todo'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Todos</h2>
        {todos.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No todos yet. Create one above!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
            >
              {editingId === todo.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(todo.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleComplete(todo.id, todo.completed)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        disabled={loading}
                      />
                      <h3
                        className={`text-lg font-semibold ${
                          todo.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h3>
                    </div>
                    {todo.description && (
                      <p className="text-gray-600 mt-2 ml-8">{todo.description}</p>
                    )}
                    <p className="text-sm text-gray-400 mt-2 ml-8">
                      Created: {new Date(todo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(todo)}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}