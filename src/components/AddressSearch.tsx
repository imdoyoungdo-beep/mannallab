"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

interface KakaoAddressResult {
  address_name: string;
  x: string;
  y: string;
}

interface Props {
  onSelect: (address: string, lat: number, lng: number) => void;
}

export default function AddressSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoAddressResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/kakao/address?query=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setResults(data.documents || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: KakaoAddressResult) => {
    setSelected(result.address_name);
    setQuery(result.address_name);
    setResults([]);
    onSelect(result.address_name, parseFloat(result.y), parseFloat(result.x));
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="출발지 주소 검색 (예: 강남역)"
          value={query}
          onChange={handleChange}
          className="h-12 rounded-xl text-base pl-9"
        />
      </div>

      {results.length > 0 && !selected && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          {results.slice(0, 5).map((r, i) => (
            <button
              key={i}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
              onClick={() => handleSelect(r)}
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm">{r.address_name}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <MapPin className="w-4 h-4" />
          <span>위치 확인됨</span>
        </div>
      )}
    </div>
  );
}
