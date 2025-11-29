"use client"
import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, AlertCircle, BookOpen, Phone, User, Calendar, Lock } from 'lucide-react';

export default function WellnessCheckIn() {
  const [currentView, setCurrentView] = useState('home');
  const [checkIns, setCheckIns] = useState([]);
  const [mood, setMood] = useState(5);
  const [journal, setJournal] = useState('');
  const [showPattern, setShowPattern] = useState(false);

  const moodEmojis = ['😢', '😟', '😐', '🙂', '😊', '😄'];
  const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good', 'Excellent'];

  const journalPrompts = [
    "What's one thing that made you smile today?",
    "How did your body feel today? Any tensions or comfort?",
    "What are you grateful for right now?",
    "What challenged you today, and how did you handle it?",
    "What would help you feel better right now?"
  ];

  const resources = [
    {
      title: "Crisis Text Line",
      description: "Text HOME to 741741 for immediate support",
      type: "hotline",
      icon: Phone
    },
    {
      title: "Mindfulness for Beginners",
      description: "5-minute guided breathing exercises",
      type: "article",
      icon: BookOpen
    },
    {
      title: "Sleep & Stress Connection",
      description: "Understanding how rest impacts mental health",
      type: "article",
      icon: BookOpen
    },
    {
      title: "Finding Professional Help",
      description: "Resources for therapy and counseling",
      type: "article",
      icon: BookOpen
    }
  ];

  const copingStrategies = {
    low: [
      "Try a 5-minute breathing exercise",
      "Reach out to someone you trust",
      "Take a short walk outside",
      "Do something creative you enjoy"
    ],
    neutral: [
      "Journal about your day",
      "Practice gratitude - list 3 good things",
      "Move your body gently",
      "Connect with a friend"
    ],
    high: [
      "Celebrate what you're doing well",
      "Share your joy with others",
      "Set a goal to maintain this energy",
      "Help someone else today"
    ]
  };

  const submitCheckIn = () => {
    if (!journal.trim()) {
      alert('Please share something in your check-in');
      return;
    }

    const newCheckIn = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      mood,
      journal,
      timestamp: new Date()
    };

    setCheckIns([...checkIns, newCheckIn]);
    setMood(5);
    setJournal('');
    setCurrentView('home');
  };

  const getMoodTrend = () => {
    if (checkIns.length < 2) return null;
    const recent = checkIns.slice(-7);
    const avgRecent = recent.reduce((sum, ci) => sum + ci.mood, 0) / recent.length;
    const older = checkIns.slice(-14, -7);
    const avgOlder = older.length ? older.reduce((sum, ci) => sum + ci.mood, 0) / older.length : avgRecent;
    return { trending: avgRecent > avgOlder ? 'up' : avgRecent < avgOlder ? 'down' : 'stable', avgRecent };
  };

  const trend = getMoodTrend();
  const showConcern = checkIns.length >= 3 && trend && trend.trending === 'down';

  const getSuggestedStrategy = () => {
    if (mood <= 2) return copingStrategies.low;
    if (mood >= 4) return copingStrategies.high;
    return copingStrategies.neutral;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-purple-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-800">Wellness Companion</h1>
          </div>
          <p className="text-gray-600">Your private space for daily mental wellness check-ins</p>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 mb-4 w-fit">
          <Lock className="w-4 h-4" />
          <span>Your data is private and encrypted</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'home', label: 'Overview', icon: '📊' },
            { id: 'checkin', label: 'Daily Check-In', icon: '💭' },
            { id: 'resources', label: 'Resources', icon: '📚' }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setCurrentView(nav.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                currentView === nav.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span>{nav.icon}</span>
              {nav.label}
            </button>
          ))}
        </div>

        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Latest Check-In Summary */}
            {checkIns.length > 0 ? (
              <div className="bg-white rounded-lg p-6 border border-purple-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Latest Check-In</h2>
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{moodEmojis[checkIns[checkIns.length - 1].mood]}</div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {moodLabels[checkIns[checkIns.length - 1].mood]}
                    </p>
                    <p className="text-sm text-gray-500">{checkIns[checkIns.length - 1].date}</p>
                    <p className="text-gray-600 mt-2">{checkIns[checkIns.length - 1].journal.substring(0, 100)}...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-8 text-center">
                <Heart className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-4">Start your first check-in today</p>
                <button
                  onClick={() => setCurrentView('checkin')}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition"
                >
                  Begin Check-In
                </button>
              </div>
            )}

            {/* Mood Trend */}
            {trend && checkIns.length >= 2 && (
              <div className={`rounded-lg p-6 border ${
                showConcern ? 'bg-orange-50 border-orange-200' : 'bg-white border-purple-100'
              }`}>
                <div className="flex items-start gap-3">
                  {showConcern && <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />}
                  {!showConcern && <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">
                      {showConcern ? "We've noticed a pattern" : "Your mood trend"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {showConcern
                        ? "Your mood has been trending down over the past week. Consider reaching out for support or trying some coping strategies."
                        : `Your mood has been trending ${trend.trending}. Average this week: ${trend.avgRecent.toFixed(1)}/5`}
                    </p>
                    {showConcern && (
                      <button
                        onClick={() => setCurrentView('resources')}
                        className="mt-3 text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        Explore support options →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Check-In History */}
            {checkIns.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-purple-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Check-Ins</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[...checkIns].reverse().slice(0, 5).map(ci => (
                    <div key={ci.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-3xl">{moodEmojis[ci.mood]}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{ci.date}</p>
                        <p className="text-xs text-gray-500">{ci.journal.substring(0, 60)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Check-In View */}
        {currentView === 'checkin' && (
          <div className="bg-white rounded-lg p-6 border border-purple-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Check-In</h2>
            <p className="text-gray-600 mb-6">Take a moment to reflect on how you're feeling</p>

            {/* Mood Selector */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-4">How are you feeling today?</label>
              <div className="flex justify-between items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`flex flex-col items-center transition transform ${
                      mood === m ? 'scale-125' : 'scale-100 opacity-60'
                    }`}
                  >
                    <span className="text-4xl mb-2">{moodEmojis[m]}</span>
                    <span className="text-xs text-gray-600 text-center">{moodLabels[m]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Random Prompt */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">💡 Reflection Prompt:</p>
              <p className="text-gray-700 mt-2">{journalPrompts[Math.floor(Math.random() * journalPrompts.length)]}</p>
            </div>

            {/* Journal Input */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-3">Share your thoughts</label>
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Write freely... this is your safe space"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                rows={5}
              />
            </div>

            {/* Suggested Strategies */}
            {mood <= 2 && (
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 font-medium mb-2">💪 Try one of these:</p>
                <div className="space-y-2">
                  {getSuggestedStrategy().map((strategy, i) => (
                    <p key={i} className="text-sm text-gray-700">• {strategy}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submitCheckIn}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105"
            >
              Save Check-In
            </button>
          </div>
        )}

        {/* Resources View */}
        {currentView === 'resources' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Support Resources</h2>
              <p className="text-gray-600">We're here to help you on your wellness journey</p>
            </div>

            {/* Crisis Support */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Immediate Support Available</h3>
                  <p className="text-red-800 text-sm mb-3">If you're in crisis, help is available right now:</p>
                  <div className="space-y-2 text-sm text-red-800">
                    <p>🤝 Crisis Text Line: Text HOME to 741741</p>
                    <p>📞 National Suicide Prevention: 988</p>
                    <p>🌍 International Association: findahelpline.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources Grid */}
            <div className="grid gap-4">
              {resources.map((resource, i) => {
                const Icon = resource.icon;
                return (
                  <div key={i} className="bg-white rounded-lg p-5 border border-purple-100 hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <Icon className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        <button className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm">
                          Learn more →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sharing Info */}
            <div className="mt-6 bg-blue-50 rounded-lg p-5 border border-blue-200">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Share with Someone You Trust</p>
                  <p className="text-sm text-blue-800">You can choose to share your check-ins with a trusted friend or therapist for additional support. All sharing is optional and controlled by you.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}