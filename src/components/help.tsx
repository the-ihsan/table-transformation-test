import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, Trophy, Lightbulb, Play } from "lucide-react";

interface HelpProps {
  onStartContest: () => void;
}

const Help = ({ onStartContest }: HelpProps) => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-gray-600">
            <Trophy className="w-4 h-4" />
            Table Transformation Contest
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-balance mb-4 text-white">
            Contest Rules & Instructions
          </h1>
          <p className="text-xl text-gray-300 text-balance max-w-2xl mx-auto">
            Master the art of table manipulation and match the projection to win
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Objective */}
          <Card className="lg:col-span-2 border-2 border-gray-600 shadow-lg bg-gray-800">
            <CardHeader className="bg-gray-700 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-gray-200" />
                <CardTitle className="text-2xl text-gray-100">
                  Contest Goal
                </CardTitle>
              </div>
              <CardDescription className="text-base text-gray-300">
                Transform your table to exactly match the projection
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-200 leading-relaxed mb-4">
                Your objective is simple: using the table editor and
                transformation controls, produce a transformed table that
                exactly matches the{" "}
                <Badge
                  variant="secondary"
                  className="font-semibold bg-gray-600 text-gray-100 border-gray-500"
                >
                  projection
                </Badge>{" "}
                shown on the right (the target view).
              </p>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-200 font-medium">
                  <strong>Match Requirements:</strong> Values, cell positions,
                  and spans (rowSpan/colSpan) must be identical.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="border-gray-600 shadow-lg bg-gray-800">
            <CardHeader className="bg-gray-700 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-gray-200" />
                <CardTitle className="text-gray-100">Quick Start</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[
                  "Study the target projection",
                  "Use table editor controls",
                  "Apply transformations",
                  "Verify exact match",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-600 text-gray-100 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-200">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Judging */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-lg bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <CheckCircle className="w-5 h-5" />
                What You Can Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Merge adjacent cells (change rowSpan / colSpan)",
                  "Split merged cells back to individual cells",
                  "Adjust table size (rows × columns)",
                  "Toggle Transform (Transpose), Repeat First, and set Column Count (N)",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <Trophy className="w-5 h-5" />
                What Will Be Judged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  {
                    title: "Exact cell values",
                    desc: "every cell value must match the projection",
                  },
                  {
                    title: "Layout & spans",
                    desc: "rowSpan / colSpan and empty filler cells must match",
                  },
                  {
                    title: "Order",
                    desc: "the transformed table must have identical row/column ordering",
                  },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-200">
                        {item.title}:
                      </span>
                      <span className="text-sm text-gray-300 ml-1">
                        {item.desc}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Example */}
        <Card className="shadow-lg mb-12 bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-100">
              Quick Example
            </CardTitle>
            <CardDescription className="text-gray-300">
              See how a source table transforms into the target projection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-200">Source Table</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <table className="w-full text-center border-collapse">
                    <tbody>
                      {[
                        [1, 2, 3],
                        [4, 5, 6],
                        [7, 8, 9],
                      ].map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="border-2 border-gray-500 px-3 py-2 bg-gray-800 font-mono text-gray-100"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h4 className="font-semibold text-gray-200">Configuration</h4>
                <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 list-disc list-inside text-white">
                  <ul>
                    <li>Transpose: false</li>
                    <li>Repeat First: false</li>
                    <li>Column Count: 1</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-200">
                  Target Projection
                </h4>
                <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <table className="w-full text-center border-collapse">
                    <tbody>
                      {[1, 4, 7, 2, 5, 8, 3, 6, 9].map((cell, i) => (
                        <tr key={i}>
                          <td className="border-2 border-gray-500 px-3 py-2 bg-gray-800 font-mono text-gray-100">
                            {cell}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring */}
        <Card className="shadow-lg mb-12 bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-100">
              Scoring & Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                "Exact match = full points for that test case",
                "Value mismatches or missing filler/blank cells = partial or zero for that case",
                "If Repeat First is set, ensure Column Count ≥ 2 or the configuration is invalid",
                "Clipped spans must be split into visible + blank continuation cells per the clipping rule",
              ].map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-600 text-gray-100 text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-200">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="shadow-lg mb-12 bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Lightbulb className="w-5 h-5" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                "Click on a cell and then Shift + Click on another cell to merge them",
                "Toggle Transform to test transpose behavior before grouping",
                "Preview your transformed result in the right-hand panel and compare carefully",
              ].map((tip, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-700 border border-gray-600 rounded-lg"
                >
                  <p className="text-sm text-gray-200 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-8 py-3 text-lg font-semibold shadow-lg border border-gray-600"
            onClick={onStartContest}
          >
            Start Contest
          </Button>
          <p className="text-sm text-gray-400 mt-3">
            Ready to test your table transformation skills?
          </p>
        </div>
      </div>
    </div>
  );
};

export default Help;
