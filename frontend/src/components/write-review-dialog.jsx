"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"



export function WriteReviewDialog({ open, onOpenChange, doctor, onSubmit , loading }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating")
      return
    }

    onSubmit({ rating, comment })

    // Reset form
    setRating(0)
    setHoveredRating(0)
    setComment("")
  }

  const handleCancel = () => {
    setRating(0)
    setHoveredRating(0)
    setComment("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Write a Review</DialogTitle>
          <DialogDescription className="text-gray-600">Share your experience with Dr. {doctor?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Doctor Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <img
              src={doctor?.profile || "/placeholder.svg"}
              alt={doctor?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{doctor?.name}</h3>
              <p className="text-sm text-blue-600">{doctor?.specialization}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating} star{rating !== 1 ? "s" : ""}
                    {rating === 1 && " - Poor"}
                    {rating === 2 && " - Fair"}
                    {rating === 3 && " - Good"}
                    {rating === 4 && " - Very Good"}
                    {rating === 5 && " - Excellent"}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this doctor..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={rating === 0||loading} >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
