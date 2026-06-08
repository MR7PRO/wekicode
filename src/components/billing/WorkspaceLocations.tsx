import { MapPin, Clock, Building, Phone } from "lucide-react";

export interface WorkspaceLocation {
  id: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  hours: string;
  capacity: string;
  status: "open" | "soon";
}

export const WORKSPACE_LOCATIONS: WorkspaceLocation[] = [
  {
    id: "gaza-rimal",
    city: "غزة",
    area: "حي الرمال",
    address: "شارع الجامعة، حي الرمال، مدينة غزة",
    phone: "+970 59 875 4887",
    hours: "متاح 24/7",
    capacity: "60 مقعد · 3 قاعات اجتماعات",
    status: "open",
  },
  {
    id: "north-gaza",
    city: "شمال غزة",
    area: "جباليا البلد",
    address: "شارع صلاح الدين، جباليا، شمال غزة",
    phone: "+970 59 875 4887",
    hours: "8 ص – 10 م",
    capacity: "30 مقعد · قاعة اجتماعات",
    status: "open",
  },
  {
    id: "central",
    city: "الوسطى",
    area: "دير البلح",
    address: "شارع البحر، دير البلح، المحافظة الوسطى",
    phone: "+970 59 875 4887",
    hours: "9 ص – 11 م",
    capacity: "25 مقعد · قاعة تدريب",
    status: "open",
  },
  {
    id: "khan-younis",
    city: "خانيونس",
    area: "وسط البلد",
    address: "شارع جمال عبد الناصر، خانيونس",
    phone: "+970 59 875 4887",
    hours: "9 ص – 11 م",
    capacity: "40 مقعد · قاعتا اجتماعات",
    status: "open",
  },
  {
    id: "rafah",
    city: "رفح",
    area: "البلد",
    address: "شارع البحر، مدينة رفح",
    phone: "+970 59 875 4887",
    hours: "قريباً",
    capacity: "20 مقعد · قاعة تدريب",
    status: "soon",
  },
];

export function WorkspaceLocations() {
  return (
    <div className="glass rounded-2xl p-6 border-border/50">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building className="w-6 h-6 text-primary" />
          القاعات والمقرات في قطاع غزة
        </h2>
        <span className="text-xs text-muted-foreground">{WORKSPACE_LOCATIONS.length} مقرات</span>
      </div>

      <p className="text-sm text-muted-foreground mb-5">
        اشتراكك يمنحك حق الوصول لجميع مقرات wekicode في القطاع. اختر المقر الأقرب لك أو انتقل بين المقرات بحرية.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {WORKSPACE_LOCATIONS.map((loc) => (
          <div
            key={loc.id}
            className="p-4 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {loc.city} <span className="text-muted-foreground font-normal">— {loc.area}</span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  loc.status === "open"
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-warning/15 text-warning border border-warning/30"
                }`}
              >
                {loc.status === "open" ? "مفتوح" : "قريباً"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5 mt-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{loc.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{loc.hours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>{loc.capacity}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span dir="ltr">{loc.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
