import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FileCode2,
  Github,
  LayoutDashboard,
  PlayCircle,
  Upload,
  Wand2,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

const quickStarts = [
  {
    icon: Upload,
    title: "Upload a project",
    description:
      "Start with a ZIP file when you want the fastest setup. TestPilot extracts the source, indexes the app, and prepares it for automated analysis.",
  },
  {
    icon: Github,
    title: "Connect GitHub",
    description:
      "Use GitHub OAuth to choose a repository and branch. This keeps