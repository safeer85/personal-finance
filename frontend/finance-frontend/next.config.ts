import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    // Keep live development chunks separate from production build output.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-local' : '.next',
  };
}
