import TransportHero from "@/components/transport/TransportHero";
import VehicleLibrary from "@/components/transport/VehicleLibrary";
import OptimizerConsole from "@/components/transport/OptimizerConsole";
import AxleView from "@/components/transport/AxleView";
import LoadingRules from "@/components/transport/LoadingRules";
import LoadSequence from "@/components/transport/LoadSequence";
import TransportCta from "@/components/transport/TransportCta";

/**
 * /transport — Truck & container load planning (transport.md).
 * Story leg 2: scanning bay → load plan (here) → docs (/dispatch) → gate.
 */
export default function Transport() {
  return (
    <>
      <TransportHero />
      <VehicleLibrary />
      <OptimizerConsole />
      <AxleView />
      <LoadingRules />
      <LoadSequence />
      <TransportCta />
    </>
  );
}
