"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

export function JoinForm() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // In a real app, you would handle the form submission here
    setSubmitted(true)
  }

  return (
    <div className="bg-white p-6 rounded-md shadow-md max-w-md mx-auto">
      <div className="text-left mb-6">
        <div className="uppercase text-sm font-semibold text-gray-500 tracking-wider">
          JOIN FINDING HOME <span className="text-amber-500 text-xs">(All fields are required.)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-gray-700">
            Password
          </label>
          <input
            id="password"
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

      <div className="mt-4 text-center text-sm">
        <Link href="/signin" className="text-amber-600 hover:underline">
          Sign in here
        </Link>{" "}
        if you already have an account
      </div>
    </div>
  )
}
