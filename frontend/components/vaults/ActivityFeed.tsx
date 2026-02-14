"use client";

import React, { useMemo } from "react";
import { formatUnits } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Activity {
  id: string;
  type: "deposit" | "withdraw" | "mint" | "redeem" | "transfer" | "approval";
  title: string;
  description: string;
  amount?: bigint;
  timestamp: number;
  status: "pending" | "success" | "failed";
  icon?: React.ReactNode;
}

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading?: boolean;
  decimals?: number;
  maxItems?: number;
}

export function ActivityFeed({
  activities = [],
  isLoading = false,
  decimals = 18,
  maxItems = 10,
}: ActivityFeedProps) {
  // Sort activities by timestamp (newest first) and limit to maxItems
  const sortedActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxItems);
  }, [activities, maxItems]);

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "deposit":
        return "📥";
      case "withdraw":
        return "📤";
      case "mint":
        return "🪙";
      case "redeem":
        return "🔄";
      case "transfer":
        return "🔀";
      case "approval":
        return "✅";
      default:
        return "•";
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "deposit":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "withdraw":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "mint":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "redeem":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "transfer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "approval":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusBadgeColor = (status: Activity["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "−";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Loading activity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>No activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-muted-foreground">
              Your vault activity will appear here
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Recent vault activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
            >
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{activity.title}</h4>
                  <Badge
                    className={getStatusBadgeColor(activity.status)}
                    variant="outline"
                  >
                    {activity.status.charAt(0).toUpperCase() +
                      activity.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {activity.amount && (
                  <p className="text-sm font-mono font-semibold">
                    {formatUnits(activity.amount, decimals)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
