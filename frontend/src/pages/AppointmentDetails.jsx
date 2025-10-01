import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

export default function AppointmentDetails() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('sessionId')
  const slotIndex = parseInt(searchParams.get('slotIndex') || '', 10)

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [slot, setSlot] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!sessionId || isNaN(slotIndex)) {
        // Not enough information
        setLoading(false)
        return
      }

      try {
        const res = await api.get(`/api/session/${sessionId}`)
        console.log("appointment data:" , res.data)
        setSession(res.data)
        const s = res.data.timeSlots?.[slotIndex]
        setSlot(s || null)
      } catch (err) {
        console.error('Failed to load session details', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId, slotIndex])

  if (loading) return <div className="p-6">Loading…</div>

  if (!session) return (
    <div className="p-6">
      <p>Session not found.</p>
      <button onClick={() => navigate('/appointments')} className="mt-4 underline text-primary">Back to appointments</button>
    </div>
  )

  return (
    <main className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div><strong>Doctor:</strong> {session.doctorId?.name || '—'}</div>
            <div><strong>Hospital:</strong> {session.hospital?.name || '—'}</div>
            <div><strong>Date:</strong> {session.date || 'TBD'}</div>
            <div><strong>Time slot:</strong> {slot ? `${slot.startTime} - ${slot.endTime}` : 'TBD'}</div>
            <div><strong>Status:</strong> {slot?.appointmentStatus || slot?.status || '—'}</div>
            <div><strong>Payment ID:</strong> {slot?.paymentIntentId || '—'}</div>
            {session.type === 'online' && (
              <div>
                <a href={session.meetingLink || '#'} target="_blank" rel="noopener noreferrer" className="text-primary underline">Join session</a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
