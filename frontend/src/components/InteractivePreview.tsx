import { ArrowUpRight, Clock3, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";

type RoomStatus = "Available" | "In session" | "Booked";
type Filter = "All rooms" | RoomStatus;

const rooms: { name: string; status: RoomStatus; capacity: number; next: string; topic: string; position: string }[] = [
  { name: "Studio 01", status: "Available", capacity: 24, next: "Available until 11:30", topic: "Open collaboration", position: "r1" },
  { name: "Lecture 02", status: "In session", capacity: 48, next: "Next class at 12:00", topic: "Design systems", position: "r2" },
  { name: "Lab 03", status: "Booked", capacity: 18, next: "Booked until 14:00", topic: "Computer lab", position: "r3" },
  { name: "Studio 04", status: "Available", capacity: 16, next: "Available until 13:00", topic: "Project room", position: "r4" },
  { name: "Lecture 05", status: "In session", capacity: 72, next: "Next class at 12:30", topic: "Applied research", position: "r5" },
  { name: "Meeting 06", status: "Available", capacity: 10, next: "Available until 15:00", topic: "Meeting room", position: "r6" },
];

const filters: Filter[] = ["All rooms", "Available", "In session", "Booked"];

export default function InteractivePreview() {
  const [filter, setFilter] = useState<Filter>("All rooms");
  const [selected, setSelected] = useState(rooms[0]);
  const visibleRooms = useMemo(() => filter === "All rooms" ? rooms : rooms.filter((room) => room.status === filter), [filter]);

  return (
    <section className="section preview-section" id="preview">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div>
            <span className="eyebrow"><span className="live-dot" /> LIVE CAMPUS PREVIEW</span>
            <h2>A campus that <span className="text-gradient">answers in real time.</span></h2>
            <p>Explore the UE Dubai Innovation Wing. Every room status, capacity and next slot—one clear view.</p>
          </div>
          <span className="campus-domain"><span className="domain-pulse" /> uedubai.campusync.net</span>
        </div>
        <div className="preview-window">
          <div className="preview-topbar">
            <div className="window-dots"><i /><i /><i /></div>
            <div className="preview-address"><MapPin size={13} /> University of Europe · Dubai</div>
            <span className="live-label"><span className="live-dot" /> LIVE</span>
          </div>
          <div className="preview-content">
            <aside className="preview-sidebar">
              <div className="sidebar-brand"><span className="mini-mark">U</span><div><strong>UE Dubai</strong><small>Innovation Wing</small></div></div>
              <span className="sidebar-caption">BUILDING</span>
              <button className="building-select">Innovation Wing <span>⌄</span></button>
              <span className="sidebar-caption sidebar-floor-label">FLOOR</span>
              <button className="floor-option floor-active">01 <span>Ground floor</span></button>
              <button className="floor-option">02 <span>Learning hub</span></button>
              <div className="sidebar-summary"><span className="live-dot" /><strong>3 rooms available</strong><small>Updated just now</small></div>
            </aside>
            <div className="floor-area">
              <div className="floor-toolbar">
                <div><h3>Ground floor</h3><span>6 spaces · 188 seats</span></div>
                <div className="room-filters">{filters.map((item) => <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
              </div>
              <div className="floor-map">
                <div className="map-label map-label-top">NORTH WING</div>
                <div className="room-grid">
                  {visibleRooms.map((room) => (
                    <button key={room.name} onClick={() => setSelected(room)} className={`room-card ${room.position} room-${room.status.toLowerCase().replace(" ", "-")} ${selected.name === room.name ? "room-selected" : ""}`}>
                      <span className="room-status-dot" /><strong>{room.name}</strong><small>{room.status}</small>
                      <span className="room-capacity"><Users size={11} /> {room.capacity}</span>
                    </button>
                  ))}
                </div>
                <div className="map-label map-label-bottom">MAIN ENTRANCE <span>↗</span></div>
              </div>
              <div className="room-detail">
                <div className={`detail-status detail-${selected.status.toLowerCase().replace(" ", "-")}`}><span className="room-status-dot" />{selected.status}</div>
                <div className="detail-main"><strong>{selected.name}</strong><span>{selected.topic}</span></div>
                <div className="detail-meta"><span><Users size={13} /> {selected.capacity} seats</span><span><Clock3 size={13} /> {selected.next}</span></div>
                <button className="icon-button detail-arrow" aria-label="View room schedule"><ArrowUpRight size={17} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}