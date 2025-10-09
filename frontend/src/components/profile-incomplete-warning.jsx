import { AlertCircle, UserPlus, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import useAuthStore from "@/store/authStore"

export default function ProfileIncompleteWarning() {
  const navigate = useNavigate()
  const { logout, refreshProfile } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState(null)

  const handleRefreshProfile = async () => {
    setIsRefreshing(true)
    setRefreshMessage(null)
    
    try {
      const result = await refreshProfile()
      
      if (result.success && result.profileComplete) {
        setRefreshMessage({ type: 'success', text: '✅ Profile loaded! Redirecting...' })
        // Wait a moment then reload the page to refresh all components
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setRefreshMessage({ 
          type: 'error', 
          text: '❌ Profile not found. Please complete registration.' 
        })
      }
    } catch (error) {
      setRefreshMessage({ 
        type: 'error', 
        text: '❌ Failed to load profile. Please try again.' 
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCompleteProfile = () => {
    // Navigate to sign-up page to complete registration
    navigate("/sign-up")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Profile Incomplete</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">
              Your account registration was not completed. You have a Firebase authentication account 
              but no profile in our system.
            </p>
            <p className="text-sm font-medium">
              To use our services (book appointments, make payments, etc.), you need to complete your profile.
            </p>
          </AlertDescription>
        </Alert>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <UserPlus className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold">What happened?</h3>
              <p className="text-sm text-muted-foreground">
                Your registration may have been interrupted or failed to save to our database. 
                This can happen due to network issues or system errors.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold">What should you do?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>First, try <strong>Refresh Profile</strong> - your profile may already exist</li>
                <li>If that doesn't work, complete your registration to create your profile</li>
                <li>Or log out and log back in to reload your data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Refresh Status Message */}
        {refreshMessage && (
          <Alert variant={refreshMessage.type === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>{refreshMessage.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleRefreshProfile}
            className="w-full"
            size="lg"
            variant="default"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Profile
              </>
            )}
          </Button>

          <Button 
            onClick={handleCompleteProfile}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Complete Registration
          </Button>
          
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Log Out
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          If you continue to experience issues, please contact support.
        </p>
      </div>
    </div>
  )
}
