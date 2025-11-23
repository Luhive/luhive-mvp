"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, MapPin, Users, Edit, Trash2, ExternalLink, BarChart3 } from "lucide-react"

export default function EventsManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedTime, setSelectedTime] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const events = [
    {
      id: 1,
      title: "How to run away from Brainrot? 🧠",
      date: "Nov 18",
      fullDate: "Nov 18, 2025",
      weekday: "Mon",
      time: "9:00 AM - 11:00 AM",
      location: "AIM Center",
      capacity: 30,
      registered: 1,
      status: "published",
      type: "workshop",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      title: "25/5 Work Together",
      date: "Nov 19",
      fullDate: "Nov 19, 2025",
      weekday: "Tue",
      time: "9:00 AM - 8:00 PM",
      location: "Fikr Coworking",
      capacity: null,
      registered: 124,
      status: "published",
      type: "networking",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      title: "Think. Shape. Build: From Insight to Startup Logic",
      date: "Nov 20",
      fullDate: "Nov 20, 2025",
      weekday: "Wed",
      time: "10:00 AM - 11:00 AM",
      location: "Sabah Hub",
      capacity: null,
      registered: 45,
      status: "published",
      type: "workshop",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 4,
      title: "Luhive Go Live 🎉",
      date: "Nov 24",
      fullDate: "Nov 24, 2025",
      weekday: "Sun",
      time: "9:00 AM - 11:00 AM",
      location: "20 Yanvar street",
      capacity: 40,
      registered: 1,
      status: "published",
      type: "conference",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 5,
      title: "Vibe Hackathon by Holberton school",
      date: "Nov 29",
      fullDate: "Nov 29, 2025",
      weekday: "Fri",
      time: "9:00 AM - 2:00 PM",
      location: "Ganjlik Plaza",
      capacity: null,
      registered: 89,
      status: "published",
      type: "hackathon",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 6,
      title: "How to give best PITCH in the world?",
      date: "Nov 30",
      fullDate: "Nov 30, 2025",
      weekday: "Sat",
      time: "2:00 PM - 5:00 PM",
      location: "Memar Ajami",
      capacity: 10,
      registered: 3,
      status: "draft",
      type: "workshop",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-200 hover:border-gray-200"
            >
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-2xl">📅</div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">{event.weekday}</span>
                    <span className="text-xl font-bold text-gray-900">{event.date}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{event.time.split("-")[0]}</span>

                    <div className="flex md:hidden items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`h-5 px-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-md ${
                          event.status === "published"
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {event.status}
                      </Badge>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50/50 rounded-full border border-blue-100">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-bold text-blue-900">{event.registered}</span>
                        <span className="text-[10px] text-blue-400">/{event.capacity || "∞"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="hidden md:flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className={`h-5 px-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-md ${
                      event.status === "published"
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {event.status}
                  </Badge>
                  <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                    {event.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{event.location}</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/50 rounded-full border border-blue-100 w-fit transition-colors group-hover:bg-blue-50 group-hover:border-blue-200">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-blue-900">{event.registered}</span>
                      <span className="text-xs text-blue-400 font-medium">
                        / {event.capacity ? event.capacity : "∞"}
                      </span>
                      <span className="text-xs text-blue-400 font-medium ml-1">registered</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 md:pl-6 md:border-l md:border-gray-50 md:justify-end">
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-100 bg-gray-50/50 rounded-lg p-1 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-md"
                      title="View Event Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-md"
                      title="Manage Guests"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-md"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Guests
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
