export interface DataSubServiceProvider {
  code: string;
  name: string;
}

export const networks: DataSubServiceProvider[] = [
  { code: "MTN", name: "MTN" },
  { code: "AIRTEL", name: "Airtel" },
  { code: "GLO", name: "Glo" },
  { code: "T2", name: "T2" },
];

export const electricityProviders: DataSubServiceProvider[] = [
  { code: "AEDC", name: "AEDC" },
  { code: "BEDC", name: "BEDC" },
  { code: "EKEDC", name: "EKEDC" },
  { code: "EEDC", name: "EEDC" },
  { code: "IBEDC", name: "IBEDC" },
  { code: "IKEDC", name: "IKEDC" },
  { code: "JEDC", name: "JEDC" },
  { code: "KAEDCO", name: "KAEDCO" },
  { code: "KEDCO", name: "KEDCO" },
  { code: "PHED", name: "PHED" },
  { code: "YEDC", name: "YEDC" },
];

export const cableProviders: DataSubServiceProvider[] = [
  { code: "DSTV", name: "DStv" },
  { code: "GOTV", name: "GOtv" },
  { code: "STARTIMES", name: "StarTimes" },
];

export const educationProviders: DataSubServiceProvider[] = [
  { code: "WAEC", name: "WAEC" },
  { code: "NECO", name: "NECO" },
  { code: "JAMB", name: "JAMB" },
  { code: "NABTEB", name: "NABTEB" },
];