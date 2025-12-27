import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, MapPin, Users, Move, RotateCcw } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  metadata?: any;
}

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  location_id?: number;
  position_x?: number;
  position_y?: number;
  is_active: boolean;
}

const MapViewer: React.FC = () => {
  const queryClient = useQueryClient();
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch locations and tables
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await apiClient.get('admin/locations');
      return response.data as Location[];
    },
  });

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await apiClient.get('admin/tables');
      return response.data as Table[];
    },
  });

  // Update table position mutation
  const updateTablePosition = useMutation({
    mutationFn: async ({
      tableId,
      locationId,
      positionX,
      positionY,
    }: {
      tableId: number;
      locationId?: number;
      positionX?: number;
      positionY?: number;
    }) => {
      const response = await apiClient.put(`admin/tables/${tableId}`, {
        location_id: locationId,
        position_x: positionX,
        position_y: positionY,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
    },
  });

  const isLoading = locationsLoading || tablesLoading;

  // Calculate map bounds
  const getMapBounds = () => {
    if (locations.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };

    const minX = Math.min(...locations.map(loc => loc.position_x));
    const minY = Math.min(...locations.map(loc => loc.position_y));
    const maxX = Math.max(...locations.map(loc => loc.position_x + loc.width));
    const maxY = Math.max(...locations.map(loc => loc.position_y + loc.height));

    return {
      minX: minX - 50,
      minY: minY - 50,
      maxX: maxX + 50,
      maxY: maxY + 50,
    };
  };

  const mapBounds = getMapBounds();

  // Snap to grid function
  const snapToGrid = (value: number, gridSize: number = 20) => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTable(null);
    setIsDragging(false);
  };

  // Handle drop on location
  const handleDropOnLocation = (e: React.DragEvent, location: Location) => {
    e.preventDefault();
    if (!draggedTable) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Snap to grid
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    // Ensure position is within location bounds
    const clampedX = Math.max(0, Math.min(snappedX, location.width - 60));
    const clampedY = Math.max(0, Math.min(snappedY, location.height - 60));

    updateTablePosition.mutate({
      tableId: draggedTable.id,
      locationId: location.id,
      positionX: clampedX,
      positionY: clampedY,
    });
  };

  // Handle drop outside locations (unassign)
  const handleDropOutside = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable) return;

    updateTablePosition.mutate({
      tableId: draggedTable.id,
      locationId: undefined,
      positionX: undefined,
      positionY: undefined,
    });
  };

  // Allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Get tables for a specific location
  const getTablesForLocation = (locationId: number) => {
    return tables.filter(table => table.location_id === locationId && table.is_active);
  };

  // Get unassigned tables
  const getUnassignedTables = () => {
    return tables.filter(table => !table.location_id && table.is_active);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading map...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Map</h1>
            <p className="text-gray-600">Drag and drop tables to assign them to locations</p>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tables', 'locations'] })}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Layout Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={mapRef}
                  className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                  style={{
                    width: '100%',
                    height: '600px',
                    minWidth: mapBounds.maxX - mapBounds.minX,
                    minHeight: mapBounds.maxY - mapBounds.minY
                  }}
                  onDrop={handleDropOutside}
                  onDragOver={handleDragOver}
                >
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Locations */}
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="absolute border-2 border-blue-500 bg-blue-50 rounded-lg shadow-sm"
                      style={{
                        left: location.position_x - mapBounds.minX,
                        top: location.position_y - mapBounds.minY,
                        width: location.width,
                        height: location.height,
                      }}
                      onDrop={(e) => handleDropOnLocation(e, location)}
                      onDragOver={handleDragOver}
                    >
                      {/* Location header */}
                      <div className="bg-blue-500 text-white px-3 py-2 rounded-t-lg">
                        <h3 className="font-semibold text-sm">{location.name}</h3>
                        <p className="text-xs opacity-90">
                          {location.width} × {location.height}
                        </p>
                      </div>

                      {/* Tables in this location */}
                      {getTablesForLocation(location.id).map((table) => (
                        <div
                          key={table.id}
                          className="absolute bg-green-500 text-white rounded-lg shadow-md cursor-move hover:bg-green-600 transition-colors"
                          style={{
                            left: table.position_x || 10,
                            top: table.position_y || 10,
                            width: 50,
                            height: 50,
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, table)}
                          onDragEnd={handleDragEnd}
                          title={`Table ${table.table_number} (${table.capacity} seats)`}
                        >
                          <div className="flex flex-col items-center justify-center h-full text-xs">
                            <Users className="h-3 w-3 mb-1" />
                            <span className="font-bold">{table.table_number}</span>
                            <span className="text-xs">{table.capacity}</span>
                          </div>
                        </div>
                      ))}

                      {/* Drop zone indicator */}
                      {isDragging && (
                        <div className="absolute inset-0 bg-blue-200 bg-opacity-50 rounded-lg border-2 border-dashed border-blue-400 flex items-center justify-center">
                          <div className="text-blue-700 font-medium">Drop table here</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md">
                    <h4 className="font-semibold text-sm mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                        <span>Location Area</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                        <span>Table</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Unassigned Tables */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unassigned Tables</CardTitle>
                <p className="text-sm text-gray-600">Drag these tables to locations</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getUnassignedTables().map((table) => (
                    <div
                      key={table.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-move hover:bg-gray-100 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, table)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{table.table_number}</p>
                          <p className="text-sm text-gray-600">{table.capacity} seats</p>
                        </div>
                      </div>
                      <Move className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                  {getUnassignedTables().length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No unassigned tables
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Locations:</span>
                    <Badge variant="secondary">{locations.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Tables:</span>
                    <Badge variant="secondary">{tables.filter(t => t.is_active).length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Assigned Tables:</span>
                    <Badge variant="secondary">
                      {tables.filter(t => t.is_active && t.location_id).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Unassigned Tables:</span>
                    <Badge variant="secondary">
                      {tables.filter(t => t.is_active && !t.location_id).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapViewer;