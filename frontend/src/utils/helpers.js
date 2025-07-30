export const getStatusColor = (status) => {
    return status === "available" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
  }
  
  export const getReportTypeColor = (type) => {
    switch (type) {
      case "diagnosis":
        return "bg-red-100 text-red-800"
      case "prescription":
        return "bg-blue-100 text-blue-800"
      case "lab-result":
        return "bg-green-100 text-green-800"
      case "notes":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  export const getAppointmentStatusColor = (status) => {
    switch (status) {
      case "reviewed":
        return "bg-green-100 text-green-800 border-green-200"
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  