import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Rnd } from 'react-rnd';
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

  // Update location position mutation
  const updateLocationPosition = useMutation({
    mutationFn: async ({
      locationId,
      positionX,
      positionY,
    }: {
      locationId: number;
      positionX: number;
      positionY: number;
    }) => {
      const response = await apiClient.put(`admin/locations/${locationId}`, {
        position_x: positionX,
        position_y: positionY,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: any) => {
      console.error('Update location error:', error);
    },
  });

  // Update location size mutation
  const updateLocationSize = useMutation({
    mutationFn: async ({
      locationId,
      width,
      height,
    }: {
      locationId: number;
      width: number;
      height: number;
    }) => {
      const response = await apiClient.put(`admin/locations/${locationId}`, {
        width,
        height,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: any) => {
      console.error('Update location size error:', error);
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

  // Collision detection utilities
  const checkOverlap = (rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }) => {
    return !(rect1.x + rect1.width <= rect2.x || 
             rect2.x + rect2.width <= rect1.x || 
             rect1.y + rect1.height <= rect2.y || 
             rect2.y + rect2.height <= rect1.y);
  };

  const findNonOverlappingPosition = (rect: { x: number; y: number; width: number; height: number }, obstacles: Array<{ x: number; y: number; width: number; height: number }>, maxAttempts: number = 50) => {
    let attempts = 0;
    let currentRect = { ...rect };
    
    while (attempts < maxAttempts) {
      let hasOverlap = false;
      
      for (const obstacle of obstacles) {
        if (checkOverlap(currentRect, obstacle)) {
          hasOverlap = true;
          // Try to move the rectangle in different directions
          const directions = [
            { x: obstacle.width + 10, y: 0 },   // Move right
            { x: -rect.width - 10, y: 0 },     // Move left
            { x: 0, y: obstacle.height + 10 },  // Move down
            { x: 0, y: -rect.height - 10 },     // Move up
            { x: obstacle.width + 10, y: obstacle.height + 10 }, // Move diagonally
            { x: -rect.width - 10, y: -rect.height - 10 },
          ];
          
          // Try the first direction that doesn't cause overlap
          for (const dir of directions) {
            const testRect = { 
              x: currentRect.x + dir.x, 
              y: currentRect.y + dir.y, 
              width: currentRect.width, 
              height: currentRect.height 
            };
            
            let testOverlap = false;
            for (const otherObstacle of obstacles) {
              if (checkOverlap(testRect, otherObstacle)) {
                testOverlap = true;
                break;
              }
            }
            
            if (!testOverlap) {
              currentRect = testRect;
              hasOverlap = false;
              break;
            }
          }
          
          if (hasOverlap) break;
        }
      }
      
      if (!hasOverlap) {
        return currentRect;
      }
      
      attempts++;
    }
    
    return rect; // Return original if no solution found
  };

  // Handle drag start for sidebar tables
  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag end for sidebar tables
  const handleDragEnd = () => {
    setDraggedTable(null);
  };

  // Allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle location drag stop
  const handleLocationDragStop = (location: Location, d: { x: number; y: number }) => {
    let newX = d.x + mapBounds.minX;
    let newY = d.y + mapBounds.minY;

    // Create obstacle rectangles for all other locations
    const obstacles = locations
      .filter(loc => loc.id !== location.id)
      .map(loc => ({
        x: loc.position_x,
        y: loc.position_y,
        width: loc.width,
        height: loc.height
      }));

    // Check for overlaps and find non-overlapping position
    const proposedRect = { x: newX, y: newY, width: location.width, height: location.height };
    const adjustedRect = findNonOverlappingPosition(proposedRect, obstacles);

    updateLocationPosition.mutate({
      locationId: location.id,
      positionX: adjustedRect.x,
      positionY: adjustedRect.y,
    });
  };

  // Handle location resize stop
  const handleLocationResizeStop = (
    _location: Location,
    _direction: string,
    ref: HTMLElement,
    _delta: { width: number; height: number },
    _position: { x: number; y: number }
  ) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;

    // Create obstacle rectangles for all other locations
    const obstacles = locations
      .filter(loc => loc.id !== _location.id)
      .map(loc => ({
        x: loc.position_x,
        y: loc.position_y,
        width: loc.width,
        height: loc.height
      }));

    // Check if the resized location overlaps with others
    const proposedRect = { 
      x: _location.position_x, 
      y: _location.position_y, 
      width: newWidth, 
      height: newHeight 
    };
    
    let hasOverlap = false;
    for (const obstacle of obstacles) {
      if (checkOverlap(proposedRect, obstacle)) {
        hasOverlap = true;
        break;
      }
    }

    // Only update if there's no overlap
    if (!hasOverlap) {
      updateLocationSize.mutate({
        locationId: _location.id,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  // Handle table drag stop
  const handleTableDragStop = (table: Table, d: { x: number; y: number }) => {
    // Find which location this table is being dropped on
    const location = locations.find(loc => {
      const locLeft = loc.position_x - mapBounds.minX;
      const locTop = loc.position_y - mapBounds.minY;
      const locRight = locLeft + loc.width;
      const locBottom = locTop + loc.height;

      return d.x >= locLeft && d.x <= locRight && d.y >= locTop && d.y <= locBottom;
    });

    let finalX: number;
    let finalY: number;
    let locationId: number | undefined;

    if (location) {
      // Dropped on a location - get relative position
      const relativeX = d.x - (location.position_x - mapBounds.minX);
      const relativeY = d.y - (location.position_y - mapBounds.minY);
      
      // Create obstacle rectangles for all other tables in this location
      const obstacles = tables
        .filter(t => t.id !== table.id && t.location_id === location.id && t.is_active)
        .map(t => ({
          x: t.position_x || 0,
          y: t.position_y || 0,
          width: 50,
          height: 50
        }));

      // Check for overlaps and find non-overlapping position
      const proposedRect = { x: relativeX, y: relativeY, width: 50, height: 50 };
      const adjustedRect = findNonOverlappingPosition(proposedRect, obstacles);

      finalX = adjustedRect.x;
      finalY = adjustedRect.y;
      locationId = location.id;
    } else {
      // Dropped outside locations - unassign and position freely
      // Create obstacle rectangles for all tables not in locations
      const obstacles = tables
        .filter(t => t.id !== table.id && !t.location_id && t.is_active)
        .map(t => ({
          x: (t.position_x || 0) + mapBounds.minX,
          y: (t.position_y || 0) + mapBounds.minY,
          width: 50,
          height: 50
        }));

      const proposedRect = { x: d.x + mapBounds.minX, y: d.y + mapBounds.minY, width: 50, height: 50 };
      const adjustedRect = findNonOverlappingPosition(proposedRect, obstacles);

      finalX = adjustedRect.x - mapBounds.minX;
      finalY = adjustedRect.y - mapBounds.minY;
      locationId = undefined;
    }

    updateTablePosition.mutate({
      tableId: table.id,
      locationId: locationId,
      positionX: finalX,
      positionY: finalY,
    });
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
            <p className="text-gray-600">Drag location headers to move locations. Use resize handles to adjust sizes. Drag tables freely - they'll automatically avoid overlaps.</p>
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
                  onDragOver={handleDragOver}
                >
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Locations */}
                  {locations.map((location) => (
                    <Rnd
                      key={location.id}
                      size={{ width: location.width, height: location.height }}
                      position={{
                        x: location.position_x - mapBounds.minX,
                        y: location.position_y - mapBounds.minY
                      }}
                      onDragStop={(_e, d) => handleLocationDragStop(location, d)}
                      onResizeStop={(_e, _direction, ref, _delta, _position) =>
                        handleLocationResizeStop(location, _direction, ref, _delta, _position)
                      }
                      minWidth={100}
                      minHeight={100}
                      dragHandleClassName="location-header"
                      bounds="parent"
                      className="group"
                    >
                      <div className="relative w-full h-full border-2 border-blue-500 bg-blue-50 rounded-lg shadow-sm">
                        {/* Location header - drag handle */}
                        <div className="location-header bg-blue-500 text-white px-3 py-2 rounded-t-lg cursor-move hover:bg-blue-600 transition-colors">
                          <h3 className="font-semibold text-sm">{location.name}</h3>
                          <p className="text-xs opacity-90">
                            {location.width} × {location.height}
                          </p>
                        </div>

                        {/* Tables in this location */}
                        {getTablesForLocation(location.id).map((table) => (
                          <Rnd
                            key={table.id}
                            size={{ width: 50, height: 50 }}
                            position={{
                              x: table.position_x || 10,
                              y: table.position_y || 10
                            }}
                            onDragStop={(_e, d) => handleTableDragStop(table, d)}
                            enableResizing={false}
                            className="group"
                          >
                            <div className="w-full h-full bg-green-500 text-white rounded-lg shadow-md cursor-move hover:bg-green-600 transition-colors flex flex-col items-center justify-center text-xs">
                              <Users className="h-3 w-3 mb-1" />
                              <span className="font-bold">{table.table_number}</span>
                              <span className="text-xs">{table.capacity}</span>
                            </div>
                          </Rnd>
                        ))}

                        {/* Drop zone indicator */}
                        {draggedTable && (
                          <div className="absolute inset-0 bg-blue-200 bg-opacity-50 rounded-lg border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
                            <div className="text-blue-700 font-medium">Drop table here</div>
                          </div>
                        )}
                      </div>
                    </Rnd>
                  ))}

                  {/* Legend */}
                  <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md">
                    <h4 className="font-semibold text-sm mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                        <span>Location Area (drag header to move, resize handles to adjust size) - no overlaps</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                        <span>Table (drag freely - automatically avoids overlaps)</span>
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