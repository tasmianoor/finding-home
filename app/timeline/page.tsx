"use client"

import Link from "next/link"
import { HomeIcon, PlusCircle } from "lucide-react"

export default function TimelinePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-black rounded p-1">
            <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </div>
          <span className="text-sm sm:text-base text-gray-800 font-medium">Finding Home</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/add-memories" className="flex items-center gap-1 text-gray-800">
            <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm sm:text-base hidden sm:inline">Add your own memories</span>
            <span className="text-sm inline sm:hidden">Add</span>
          </Link>
          <Link href="/profile" className="text-sm sm:text-base text-gray-800">
            Profile
          </Link>
        </div>
      </header>

      {/* Featured Story Section */}
      <section className="bg-amber-50/80 py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-block bg-amber-200 px-3 sm:px-4 py-1 rounded-md">
                <span className="font-medium text-amber-900 text-sm sm:text-base">NEW STORY</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
                Episode 15:
                <br />
                Finding Queens
              </h1>

              <p className="text-base sm:text-lg text-gray-800 max-w-lg">
                It was pure luck that we were granted our green cards in the 90s. With our family growing, its exactly
                the type of good news we needed.
              </p>

              <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors text-sm sm:text-base">
                Listen now
              </button>
            </div>

            <div className="relative mt-6 lg:mt-0">
              <div className="bg-amber-100/50 absolute inset-0 rounded-lg transform translate-x-2 sm:translate-x-4 translate-y-2 sm:translate-y-4"></div>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-28%20at%201.51.26%E2%80%AFPM-xgi0cRm6JvFkfNSM7Awgf85UKmY2G5.png"
                alt="Three young girls in pink dresses"
                className="relative z-10 rounded-md w-full h-auto"
              />
            </div>
          </div>

          {/* Browse All Stories Link */}
          <div className="flex justify-end mt-6 sm:mt-8">
            <Link href="/stories" className="text-sm sm:text-base text-gray-800 hover:text-amber-700 font-medium">
              Browse all stories &gt;
            </Link>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex">
            <Link
              href="/dashboard"
              className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base text-gray-500 hover:text-gray-900 whitespace-nowrap"
            >
              DASHBOARD
            </Link>
            <Link
              href="/timeline"
              className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base text-gray-900 border-b-2 border-amber-600 relative whitespace-nowrap"
            >
              TIMELINE
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 md:mb-12">Story of Robin Noor</h2>

          {/* Timeline */}
          <div className="relative">
            {/* Center Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-amber-500"></div>

            {/* Timeline Events */}
            <div className="space-y-12 sm:space-y-16 md:space-y-24 relative">
              {/* 1951 Event */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-8 md:text-right order-2 md:order-1 mb-4 md:mb-0 w-full">
                  <div className="bg-amber-50 p-4 sm:p-6 rounded-md shadow-sm border border-amber-100 md:inline-block w-full md:w-auto">
                    <div className="font-semibold text-gray-800 mb-1">1951</div>
                    <p className="text-gray-700">Born in East Pakistan</p>
                  </div>
                </div>
                <div className="mx-auto md:mx-0 order-1 md:order-2 mb-4 md:mb-0 z-10 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 border-4 border-white shadow"></div>
                </div>
                <div className="md:w-1/2 md:pl-8 hidden md:block order-3"></div>
              </div>

              {/* 1955-1959 Event */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-8 hidden md:block order-1"></div>
                <div className="mx-auto md:mx-0 order-2 mb-4 md:mb-0 z-10 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 border-4 border-white shadow"></div>
                </div>
                <div className="md:w-1/2 md:pl-8 order-3 mb-4 md:mb-0 w-full">
                  <div className="bg-amber-50 p-4 sm:p-6 rounded-md shadow-sm border border-amber-100 md:inline-block w-full md:w-auto">
                    <div className="font-semibold text-gray-800 mb-1">1955 - 1959</div>
                    <p className="text-gray-700 text-sm sm:text-base">
                      Lived in Calcutta. Attended primary and secondary school, witnessing the political turmoil of the
                      region, including the struggle for independence from Pakistan.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1959-1971 Event */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-8 md:text-right order-2 md:order-1 mb-4 md:mb-0 w-full">
                  <div className="bg-amber-50 p-4 sm:p-6 rounded-md shadow-sm border border-amber-100 md:inline-block w-full md:w-auto">
                    <div className="font-semibold text-gray-800 mb-1">1959 - 1971</div>
                    <p className="text-gray-700 text-sm sm:text-base">
                      Received weapons to protect his home during the Bangladesh Liberation War, fighting for
                      independence from Pakistan. Schooling was halted.
                    </p>
                  </div>
                </div>
                <div className="mx-auto md:mx-0 order-1 md:order-2 mb-4 md:mb-0 z-10 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 border-4 border-white shadow"></div>
                </div>
                <div className="md:w-1/2 md:pl-8 hidden md:block order-3"></div>
              </div>

              {/* 1972-1974 Event */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-8 hidden md:block order-1"></div>
                <div className="mx-auto md:mx-0 order-2 mb-4 md:mb-0 z-10 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 border-4 border-white shadow"></div>
                </div>
                <div className="md:w-1/2 md:pl-8 order-3 mb-4 md:mb-0 w-full">
                  <div className="bg-amber-50 p-4 sm:p-6 rounded-md shadow-sm border border-amber-100 md:inline-block w-full md:w-auto">
                    <div className="font-semibold text-gray-800 mb-1">1972 - 1974</div>
                    <p className="text-gray-700 text-sm sm:text-base">
                      Completes his high school exams and enters Dhaka College, where he explores cricket.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1975-1977 Event */}
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-8 md:text-right order-2 md:order-1 mb-4 md:mb-0 w-full">
                  <div className="bg-amber-50 p-4 sm:p-6 rounded-md shadow-sm border border-amber-100 md:inline-block w-full md:w-auto">
                    <div className="font-semibold text-gray-800 mb-1">1975 - 1977</div>
                    <p className="text-gray-700 text-sm sm:text-base">
                      Continues getting trainings and actively taking part in the organization of a cricket team. Also
                      transitions from Dhaka College to Dhaka University.
                    </p>
                  </div>
                </div>
                <div className="mx-auto md:mx-0 order-1 md:order-2 mb-4 md:mb-0 z-10 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 border-4 border-white shadow"></div>
                </div>
                <div className="md:w-1/2 md:pl-8 hidden md:block order-3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-3 md:mb-0">
            <div className="bg-white rounded p-1">
              <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
            </div>
            <span className="text-sm sm:text-base font-medium">Finding home</span>
          </div>
          <div className="text-center md:text-right text-xs sm:text-sm">
            <p>Copyrighted 2024</p>
            <p>Designed by T. Noor</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
