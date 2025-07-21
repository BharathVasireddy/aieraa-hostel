import React from 'react'
import { useRouter } from 'next/navigation'

interface QuickSearchProps {
  searchTerms: string[]
}

const QuickSearch: React.FC<QuickSearchProps> = ({ searchTerms }) => {
  const router = useRouter()

  const handleSearchClick = (term: string) => {
    localStorage.setItem('searchQuery', term)
    router.push('/student/menu')
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Search</h2>
      <div className="flex flex-wrap gap-2">
        {searchTerms.map((term, index) => (
          <button
            key={index}
            onClick={() => handleSearchClick(term)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickSearch 