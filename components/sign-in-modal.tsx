"use client"
import { X } from "lucide-react"

export function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              WELCOME HOME{" "}
              <span className="text-sm text-gray-500">
                New to Finding Home?{" "}
                <a href="#" className="text-amber-500">
                  Sign up here
                </a>
              </span>
            </h3>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signin-email" className="block text-sm text-gray-700">
                Email address
              </label>
              <input
                id="signin-email"
                type="email"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signin-password" className="block text-sm text-gray-700">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md transition-colors"
            >
              SUBMIT
            </button>
          </form>

          <div className="mt-4">
            <button className="w-full bg-amber-100 text-amber-800 py-2 rounded-md hover:bg-amber-200 transition-colors">
              I forgot my password
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
