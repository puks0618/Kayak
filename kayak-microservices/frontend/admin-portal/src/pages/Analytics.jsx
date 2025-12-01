/**
 * Analytics Page - Host/Provider Analytics
 */

import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Analytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const Analytics = () => {
  const [pageClicks, setPageClicks] = useState([]);
  const [listingClicks, setListingClicks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [leastViewed, setLeastViewed] = useState([]);
  const [userTraces, setUserTraces] = useState([]);
  const [biddingTraces, setBiddingTraces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [pageData, listingData, reviewData, leastData, traceData, biddingData] = await Promise.allSettled([
        analyticsApi.getPageClicks(),
        analyticsApi.getPropertyClicks(),
        analyticsApi.getReviewsAnalytics(),
        analyticsApi.getLeastViewedAreas(),
        analyticsApi.getUserTrace(),
        analyticsApi.getBiddingTrace()
      ]);

      if (pageData.status === 'fulfilled') setPageClicks(pageData.value.pageClicks || []);
      if (listingData.status === 'fulfilled') setListingClicks(listingData.value.propertyClicks?.slice(0, 10) || []);
      if (reviewData.status === 'fulfilled') setReviews(reviewData.value.reviews || []);
      if (leastData.status === 'fulfilled') setLeastViewed(leastData.value.leastViewed || []);
      if (traceData.status === 'fulfilled') setUserTraces(traceData.value.traces || []);
      if (biddingData.status === 'fulfilled') setBiddingTraces(biddingData.value.biddingTraces || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="analytics-page">
      <h1>Host & Provider Analytics</h1>

      {/* Page Clicks Chart */}
      <div className="chart-section">
        <h2>Page Clicks</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pageClicks}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="page" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clicks" fill="#0088FE" />
            <Bar dataKey="uniqueVisitors" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Listing Clicks Chart */}
      <div className="chart-section">
        <h2>Top 10 Listing Clicks</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={listingClicks} dataKey="clicks" nameKey="property_name" cx="50%" cy="50%" outerRadius={100} label>
              {listingClicks.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Reviews Chart */}
      <div className="chart-section">
        <h2>Reviews Analytics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reviews}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="property_type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg_rating" fill="#FFBB28" name="Avg Rating" />
            <Bar dataKey="total_reviews" fill="#FF8042" name="Total Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Least Viewed Sections */}
      <div className="panel-section">
        <h2>Least Seen Sections</h2>
        <div className="least-viewed-list">
          {leastViewed.map((section, idx) => (
            <div key={idx} className="least-viewed-item">
              <span className="section-name">{section.section}</span>
              <span className="section-views">{section.views} views ({section.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Trace Timeline */}
      <div className="trace-section">
        <h2>User Journey Trace</h2>
        {userTraces.map((trace, idx) => (
          <div key={idx} className="trace-timeline">
            <h3>User: {trace.userId} | City: {trace.city}</h3>
            <div className="timeline">
              {trace.journey?.map((step) => (
                <div key={step.step} className="timeline-step">
                  <div className="step-number">{step.step}</div>
                  <div className="step-content">
                    <strong>{step.action}</strong>
                    <span className="step-time">{new Date(step.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bidding Trace */}
      <div className="trace-section">
        <h2>Bidding/Limited Offers Trace</h2>
        {biddingTraces.map((trace, idx) => (
          <div key={idx} className="bidding-trace">
            <h3>{trace.itemName} - Current: ${trace.currentBid} ({trace.status})</h3>
            <div className="bid-list">
              {trace.bids?.map((bid, bidIdx) => (
                <div key={bidIdx} className="bid-item">
                  <span className="bid-user">{bid.userId}</span>
                  <span className="bid-amount">${bid.amount}</span>
                  <span className="bid-time">{new Date(bid.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
