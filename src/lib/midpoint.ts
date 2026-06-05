interface Location {
  latitude: number;
  longitude: number;
}

export function calculateMidpoint(locations: Location[]): Location {
  if (locations.length === 0) throw new Error('위치 정보가 없습니다');
  if (locations.length === 1) return locations[0];

  const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
  const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

  return { latitude: avgLat, longitude: avgLng };
}

export function countVotesByDate(
  dateOptions: Array<{ id: string; date: string }>,
  participants: Array<{ votes: Array<{ date_option_id: string }> }>
): Array<{ date: string; count: number; optionId: string }> {
  return dateOptions
    .map((option) => ({
      date: option.date,
      optionId: option.id,
      count: participants.filter((p) =>
        p.votes.some((v) => v.date_option_id === option.id)
      ).length,
    }))
    .sort((a, b) => b.count - a.count);
}
