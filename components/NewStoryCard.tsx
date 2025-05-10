import Link from 'next/link'

interface NewStoryCardProps {
  episodeNumber: number
  title: string
  description: string
  imageSrc: string
  storyId: string
}

export default function NewStoryCard({ episodeNumber, title, description, imageSrc, storyId }: NewStoryCardProps) {
  return (
    <div className="w-full bg-white mt-8 sm:mt-10 md:mt-12">
      <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        <h2 className="text-gray-500 text-sm sm:text-base font-medium uppercase tracking-wider mb-6 sm:mb-8">
          UP NEXT
        </h2>

        <Link href={`/stories/${storyId}`} className="block">
          <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/0 z-10"></div>
            <img src={imageSrc} alt={title} className="w-full h-64 sm:h-72 md:h-80 object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
              <div className="inline-block bg-amber-200 px-3 sm:px-4 py-1 rounded-md mb-3">
                <span className="font-medium text-amber-900 text-xs sm:text-sm">EPISODE {episodeNumber}</span>
              </div>
              <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2">{title}</h3>
              <p className="text-gray-200 text-sm sm:text-base line-clamp-2">{description}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
} 