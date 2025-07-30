import { Star, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"



export function ReviewItem({ review }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className="shadow-md border-0 bg-white hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{review.patient.name}</p>
                <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
              ))}
              <span className="ml-1 text-sm font-medium text-gray-600">({review.rating})</span>
            </div>
          </div>

          {review.comment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
