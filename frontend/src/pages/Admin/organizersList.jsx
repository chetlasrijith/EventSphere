import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import InfiniteScroll from "react-infinite-scroll-component";

const OrganizersList = () => {
    const [organizers, setOrganizers] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMoreOrganizers();
    }, []);

    const fetchMoreOrganizers = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_SERVER}/api/admin/list-organizers?page=${page}&limit=10`,
                { withCredentials: true }
            );

            const data = res.data;

            if (data.organizers.length === 0) {
                setHasMore(false);
                return;
            }

            setOrganizers((prev) => {
                const newOrganizers = data.organizers.filter(
                    (org) => !prev.some((existing) => existing._id === org._id)
                );
                return [...prev, ...newOrganizers]; // Ensures no duplicates
            });

            setPage((prev) => prev + 1);
        } catch (error) {
            console.error("Error fetching organizers:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container
            fluid
            style={{
                backgroundColor: "#121212",
                minHeight: "100vh",
                color: "#F8FAFC",
                padding: "20px",
            }}
        >
            <h2 className="text-center text-light mb-4">Organizers</h2>

            <InfiniteScroll
                dataLength={organizers.length}
                next={fetchMoreOrganizers}
                hasMore={hasMore}
                loader={<h5 className="text-center text-light">Loading more...</h5>}
                endMessage={<p className="text-center text-secondary">No more organizers</p>}
            >
                <Row className="g-4">
                    {organizers.map((organizer) => (
                        <Col key={organizer._id} md={6} lg={4}>
                            <Card className="bg-dark text-light border-0 shadow-lg">
                                {/* Banner */}
                                <Card.Img
                                    variant="top"
                                    src={organizer.coverImage || "/images/banner.webp"}
                                    alt="Banner"
                                    style={{ height: "120px", objectFit: "cover" }}
                                />

                                <Card.Body>
                                    <div className="d-flex align-items-center mb-3">
                                        {/* Profile Image */}
                                        <img
                                            src={organizer.profileImg || "/images/sampleProfile.webp"}
                                            alt="Profile"
                                            className="rounded-circle border"
                                            style={{
                                                width: "70px",
                                                height: "70px",
                                                objectFit: "cover",
                                                marginRight: "15px",
                                            }}
                                        />

                                        {/* Basic Details */}
                                        <div>
                                            <h5 className="mb-1 text-info">{organizer.username}</h5>
                                            <p className="mb-1">{organizer.email}</p>
                                            <p className="mb-1">📞 {organizer.mobileNumber}</p>
                                            <p className="mb-0">
                                                <FaStar color="gold" /> {organizer.rating || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Address Card */}
                                    <Card className="bg-secondary text-light border-0 p-2">
                                        <p className="mb-0">
                                            {organizer.address?.street}, {organizer.address?.city}
                                        </p>
                                        <p className="mb-0">
                                            {organizer.address?.state}, {organizer.address?.country}
                                        </p>
                                    </Card>

                                    {/* View Profile Button */}
                                    <Link
                                        to={`/admin/organizerProfile/${organizer._id}`}
                                        className="btn btn-info btn-sm mt-3 w-100"
                                    >
                                        View Profile
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </InfiniteScroll>
        </Container>
    );
};

export default OrganizersList;
