import React, { useState, useEffect } from 'react';
import { useFleet } from '../../contexts/FleetContext.js';
import { api } from '../../services/api.js';
import {
  Route,
  Clock,
  Fuel,
  MapPin,
  Truck,
  ArrowRight,
  TrendingDown,
  Navigation,
  Calendar,
  Gauge
} from 'lucide-react';
import { Trip } from '../../types/index.js';

export const TripsPage: React.FC = () => {
  const { selectedVehicle } = useFleet();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!selectedVehicle) {
        setTrips([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await api.getTrips(selectedVehicle.id);
        setTrips(data);
        if (data.length > 0) {
          setSelectedTrip(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [selectedVehicle]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-400" />
            <span>Trip History & Fuel Consumption Logs</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Historical vehicle routes, mileage, average speeds, and verified fuel depletion analytics
          </p>
        </div>

        {selectedVehicle && (
          <div className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            Vehicle: <span className="text-emerald-400 font-bold">{selectedVehicle.vehicleNumber}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-xs">Loading recorded trips...</div>
      ) : trips.length === 0 ? (
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Route className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-zinc-300">No Recorded Trips Yet</div>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Trips will automatically populate as the vehicle travels and streams NEO-6M GPS coordinates and fuel levels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Selection List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
              Logged Journeys ({trips.length})
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const startDate = new Date(trip.startTime);
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-zinc-850 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-200">
                        {startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="font-mono text-emerald-400">
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                      <div>
                        <div className="text-[10px] text-zinc-500">Distance</div>
                        <div className="font-bold text-zinc-200">{trip.distanceKm.toFixed(1)} km</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">Duration</div>
                        <div className="font-bold text-zinc-200">{trip.durationMinutes} min</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">Fuel Used</div>
                        <div className="font-bold text-emerald-400">{trip.fuelConsumedLiters?.toFixed(1) || 0} L</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Trip Deep-Dive Details */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTrip ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Route className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-100">Trip Telemetry Breakdown</h2>
                      <p className="text-xs text-zinc-400">
                        {new Date(selectedTrip.startTime).toLocaleString()} - {selectedTrip.endTime ? new Date(selectedTrip.endTime).toLocaleTimeString() : 'In Progress'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-zinc-500">Trip ID</div>
                    <div className="text-zinc-300 font-bold">{selectedTrip.id}</div>
                  </div>
                </div>

                {/* Key Metrics Bento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-400" /> Total Distance
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mt-1">{selectedTrip.distanceKm.toFixed(1)} <span className="text-xs font-normal text-zinc-500">km</span></div>
                  </div>

                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" /> Duration
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mt-1">{selectedTrip.durationMinutes} <span className="text-xs font-normal text-zinc-500">min</span></div>
                  </div>

                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-emerald-400" /> Fuel Burned
                    </div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">{selectedTrip.fuelConsumedLiters?.toFixed(1) || 0} <span className="text-xs font-normal text-zinc-500">Liters</span></div>
                  </div>

                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-purple-400" /> Avg Speed
                    </div>
                    <div className="text-xl font-bold text-zinc-100 mt-1">{selectedTrip.averageSpeedKmh?.toFixed(0) || 45} <span className="text-xs font-normal text-zinc-500">km/h</span></div>
                  </div>
                </div>

                {/* Start & End Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Origin Start
                    </div>
                    <div className="font-mono text-zinc-200">
                      Lat: {selectedTrip.startLatitude.toFixed(4)}, Lng: {selectedTrip.startLongitude.toFixed(4)}
                    </div>
                    <div className="text-zinc-400 text-[11px]">
                      Initial Fuel Tank: {selectedTrip.fuelStartLiters.toFixed(1)} Liters
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> Destination End
                    </div>
                    <div className="font-mono text-zinc-200">
                      {selectedTrip.endLatitude ? `Lat: ${selectedTrip.endLatitude.toFixed(4)}, Lng: ${selectedTrip.endLongitude?.toFixed(4)}` : 'Trip Active'}
                    </div>
                    <div className="text-zinc-400 text-[11px]">
                      Final Fuel Tank: {selectedTrip.fuelEndLiters?.toFixed(1) || selectedTrip.fuelStartLiters.toFixed(1)} Liters
                    </div>
                  </div>
                </div>

                {/* Waypoints Sequence */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    GPS Waypoint Telemetry Log ({selectedTrip.waypoints.length} Records)
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 bg-zinc-950 text-xs font-mono">
                    {selectedTrip.waypoints.map((wp, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between hover:bg-zinc-900/60">
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 text-[10px]">#{i + 1}</span>
                          <span className="text-zinc-300">
                            {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-zinc-400">{wp.speed ? `${wp.speed} km/h` : '0 km/h'}</span>
                          <span className="text-emerald-400 font-bold">{wp.fuelLiters ? `${wp.fuelLiters} L` : ''}</span>
                          <span className="text-zinc-500">{new Date(wp.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
