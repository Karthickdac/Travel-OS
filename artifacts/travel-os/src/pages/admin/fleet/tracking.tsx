import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Navigation, MapPin, Gauge, Route as RouteIcon, Play, Square, Car, Radio } from "lucide-react";

type LivePos = {
  deviceId: string;
  deviceLabel: string | null;
  vehicleId: string | null;
  vehicleReg: string | null;
  vehicleModel: string | null;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  lastPingAt: string | null;
  trip: { bookingId: string; bookingNumber: string | null; trackedKm: number; routeDistanceKm: number; pickup: string | null; drop: string | null } | null;
};

type Trip = {
  bookingId: string;
  bookingNumber: string;
  status: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  vehicleNumber: string | null;
  driverName: string | null;
  customerName: string;
  tracking: { status: string; trackedKm: number; routeDistanceKm: number; progress: number } | null;
};

type RouteData = {
  status: string;
  routeGeometry: [number, number][];
  routeDistanceKm: number;
  trackedKm: number;
  progress: number;
  trail: { lat: number; lng: number; speed: number | null; recordedAt: string }[];
  current: { lat: number; lng: number } | null;
};

function carIcon(heading: number | null, active: boolean) {
  const color = active ? "#f97316" : "#64748b";
  const rot = heading ?? 0;
  return L.divIcon({
    className: "",
    html: `<div style="transform: rotate(${rot}deg); width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
      <div style="background:${color}; width:26px; height:26px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-6l2-5h9l4 5h2a2 2 0 0 1 2 2v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) {
      map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [50, 50], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

function statusBadge(s: string) {
  if (s === "live") return <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>;
  if (s === "completed") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
  return <Badge variant="outline">Idle</Badge>;
}

export default function AdminFleetTracking() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("map");
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const tickBusy = useRef(false);

  const { data: live, isLoading: liveLoading } = useQuery<LivePos[]>({
    queryKey: ["/v1/gps/live"],
    queryFn: () => api.get("/gps/live"),
    refetchInterval: 3000,
  });

  const { data: trips } = useQuery<Trip[]>({
    queryKey: ["/v1/gps/trips"],
    queryFn: () => api.get("/gps/trips"),
    refetchInterval: 5000,
  });

  const { data: routeData } = useQuery<RouteData>({
    queryKey: ["/v1/gps/trips/route", selectedTrip],
    queryFn: () => api.get(`/gps/trips/${selectedTrip}/route`),
    enabled: !!selectedTrip,
    refetchInterval: selectedTrip ? 3000 : false,
  });

  // Drive the simulation: advance live trips every 3s while this page is open.
  useEffect(() => {
    const id = setInterval(async () => {
      if (tickBusy.current) return;
      tickBusy.current = true;
      try {
        const r = await api.post<{ advanced: number }>("/gps/tick", {});
        if (r.advanced > 0) {
          qc.invalidateQueries({ queryKey: ["/v1/gps/live"] });
          qc.invalidateQueries({ queryKey: ["/v1/gps/trips"] });
        }
      } catch { /* ignore transient tick errors */ } finally {
        tickBusy.current = false;
      }
    }, 3000);
    return () => clearInterval(id);
  }, [qc]);

  const startMut = useMutation({
    mutationFn: (bookingId: string) => api.post(`/gps/trips/${bookingId}/start`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/gps/trips"] });
      qc.invalidateQueries({ queryKey: ["/v1/gps/live"] });
      toast({ title: "Tracking started", description: "Live location is now being recorded for this trip." });
    },
    onError: (e: any) => toast({ title: e.message ?? "Could not start tracking", variant: "destructive" }),
  });
  const stopMut = useMutation({
    mutationFn: (bookingId: string) => api.post(`/gps/trips/${bookingId}/stop`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/v1/gps/trips"] });
      toast({ title: "Tracking stopped" });
    },
    onError: (e: any) => toast({ title: e.message ?? "Could not stop tracking", variant: "destructive" }),
  });

  const positions = live ?? [];
  const activeVehicles = positions.filter((p) => p.trip).length;
  const totalKmToday = (trips ?? []).reduce((s, t) => s + (t.tracking?.trackedKm ?? 0), 0);
  const mapPoints = useMemo<[number, number][]>(() => positions.map((p) => [p.lat, p.lng]), [positions]);
  const defaultCenter: [number, number] = mapPoints[0] ?? [11.0168, 76.9558]; // Coimbatore fallback

  const routeGeom = routeData?.routeGeometry ?? [];
  const trailGeom = (routeData?.trail ?? []).map((t) => [t.lat, t.lng]) as [number, number][];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-muted-foreground mt-1">Real-time GPS positions, routes and distance travelled per trip.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Vehicles Online</CardTitle><Radio className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{positions.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Active Trips</CardTitle><Navigation className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{activeVehicles}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Total KM Tracked</CardTitle><RouteIcon className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalKmToday.toFixed(1)}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">Trips Tracked</CardTitle><Car className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{(trips ?? []).filter((t) => t.tracking).length}</p></CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="trips">Trips &amp; Distance</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[560px] w-full relative">
                {liveLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <MapContainer center={defaultCenter} zoom={11} className="h-full w-full z-0" scrollWheelZoom>
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {selectedTrip && routeGeom.length > 1 && (
                      <Polyline positions={routeGeom} pathOptions={{ color: "#94a3b8", weight: 4, dashArray: "6 8" }} />
                    )}
                    {selectedTrip && trailGeom.length > 1 && (
                      <Polyline positions={trailGeom} pathOptions={{ color: "#f97316", weight: 5 }} />
                    )}
                    {positions.map((p) => (
                      <Marker key={p.deviceId} position={[p.lat, p.lng]} icon={carIcon(p.heading, !!p.trip)}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{p.vehicleReg ?? p.deviceLabel ?? "Vehicle"}</p>
                            {p.vehicleModel && <p className="text-muted-foreground">{p.vehicleModel}</p>}
                            <p className="mt-1">Speed: {p.speed != null ? `${Math.round(p.speed)} km/h` : "—"}</p>
                            {p.trip && (
                              <p className="mt-1">Trip {p.trip.bookingNumber}: {p.trip.trackedKm.toFixed(1)} / {p.trip.routeDistanceKm.toFixed(1)} km</p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {selectedTrip && routeGeom.length > 0 && <FitBounds points={routeGeom} />}
                    {!selectedTrip && mapPoints.length > 0 && <FitBounds points={mapPoints} />}
                  </MapContainer>
                )}
                {!liveLoading && positions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center bg-background/90 rounded-lg p-6 shadow-sm pointer-events-auto">
                      <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No vehicles online</p>
                      <p className="text-sm text-muted-foreground">Start tracking a trip to see it live here.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {selectedTrip && routeData && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing route for selected trip — {routeData.trackedKm.toFixed(1)} km of {routeData.routeDistanceKm.toFixed(1)} km covered.
              <Button variant="link" className="h-auto p-0 ml-2" onClick={() => setSelectedTrip(null)}>Show all vehicles</Button>
            </p>
          )}
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Trips &amp; Distance</CardTitle></CardHeader>
            <CardContent>
              {!trips ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RouteIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No trips yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((t) => {
                      const tk = t.tracking;
                      const isLive = tk?.status === "live";
                      return (
                        <TableRow key={t.bookingId}>
                          <TableCell>
                            <div className="font-medium">{t.bookingNumber}</div>
                            <div className="text-xs text-muted-foreground">{t.customerName}</div>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <div className="flex items-center gap-1.5 text-sm truncate"><MapPin className="h-3 w-3 text-green-600 shrink-0" />{t.pickupLocation}</div>
                            <div className="flex items-center gap-1.5 text-sm truncate"><MapPin className="h-3 w-3 text-red-600 shrink-0" />{t.dropLocation}</div>
                          </TableCell>
                          <TableCell className="text-sm">{t.vehicleNumber ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                          <TableCell>{statusBadge(tk?.status ?? "idle")}</TableCell>
                          <TableCell className="text-right">
                            {tk ? (
                              <div>
                                <div className="font-semibold flex items-center justify-end gap-1"><Gauge className="h-3.5 w-3.5 text-muted-foreground" />{tk.trackedKm.toFixed(1)} km</div>
                                <div className="text-xs text-muted-foreground">of {tk.routeDistanceKm.toFixed(1)} km</div>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {tk && (
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedTrip(t.bookingId); setTab("map"); }} title="View on map">
                                  <MapPin className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isLive ? (
                                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => stopMut.mutate(t.bookingId)} disabled={stopMut.isPending}>
                                  <Square className="h-3.5 w-3.5" />Stop
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => startMut.mutate(t.bookingId)} disabled={startMut.isPending}>
                                  <Play className="h-3.5 w-3.5" />{tk?.status === "completed" ? "Restart" : "Track"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
