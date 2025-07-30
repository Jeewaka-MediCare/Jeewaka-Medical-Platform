"use client"

import { X, Star } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { SessionItem } from "@/components/session-item"
import { ReviewItem } from "@/components/review-item"

export function DoctorDetails({ doctor, ratingSummary, sessions, reviews, onClose }) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Doctor Profile</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid md:grid-cols-[250px_1fr] gap-6">
          <div className="space-y-4">
            <div className="relative h-64 w-full rounded-md overflow-hidden">
              <Image src={doctor.profile || "/placeholder.svg"} alt={doctor.name} fill className="object-cover" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold">{doctor.name}</h2>
              <p className="text-muted-foreground">{doctor.specialization}</p>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{ratingSummary.avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({ratingSummary.totalReviews} reviews)</span>
              </div>

              <div className="pt-2">
                <Badge className="bg-primary/10 text-primary border-none">
                  ${doctor.consultationFee.toLocaleString()}
                </Badge>
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium">Experience</p>
                <p className="text-sm">{doctor.yearsOfExperience} years</p>
              </div>

              <div>
                <p className="text-sm font-medium">Languages</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {doctor.languagesSpoken.map((language) => (
                    <Badge key={language} variant="outline" className="text-xs">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>

              {doctor.subSpecializations.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Sub-specializations</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {doctor.subSpecializations.map((subSpec) => (
                      <Badge key={subSpec} variant="outline" className="text-xs">
                        {subSpec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {doctor.bio && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="sessions">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="sessions">Available Sessions</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="space-y-4 pt-4">
                {sessions.length > 0 ? (
                  sessions.map((session) => <SessionItem key={session._id} session={session} />)
                ) : (
                  <p className="text-center text-muted-foreground py-4">No available sessions</p>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 pt-4">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <div key={index}>
                      <ReviewItem review={review} />
                      {index < reviews.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No reviews yet</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
