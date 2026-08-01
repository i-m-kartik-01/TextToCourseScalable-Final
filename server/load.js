import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    generate_courses: {
      executor: "constant-arrival-rate",
      rate: 150,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 300,
      maxVUs: 500,
    },
  },
};

const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkpkdEZCQ1JCTEVWbmVOdHBTc1lPaiJ9.eyJpc3MiOiJodHRwczovL2Rldi04dXhpYmZ6c3RsbzQzOGl5LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNTMwMTkwNTg3MTYyNzY0NDU1MCIsImF1ZCI6WyJodHRwczovL3RleHQtdG8tY291cnNlLWFwaSIsImh0dHBzOi8vZGV2LTh1eGliZnpzdGxvNDM4aXkudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc4NTU4MTM4MiwiZXhwIjoxNzg1NjY3NzgyLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiYXpwIjoiWlBzVFZOdjlQRE1kTzZYS2VKaElmaGxnY1JWTDZBUnAifQ.cSioulRP3-oFNQ7nsPssRVwiAuBwEUYrwRDtDY_6nP8d9Li6iysKMYq_-TvPwt5xZIEO5GIGUW8ltMug-kd5LEOmRLbTsDgqdk-n7IQTHa5PGOUbQX0giHuLpVJdE2VQV-AKJfamH8LV3pQcfiPl1iWiKQb4-zCVzMe_Aw5f8PCcyWzql99NdLrNDBuY2U_XaZ2V_KfAWOidnCGzcszTmcpz7yaX5b5e7wp0N43nAx7jft1cHwPqHWQUhOVTk1qk88EJEtyyTlMGxb8d0RbHvKkL_MftMd5x75ddzsdSKNbpr6nMzkN_2rCp0gmN3sOnOmL_73PXztvOM_Y1kGO_oQ";

export default function () {

    const body = JSON.stringify({
        topic: `Load Testing ${__VU}-${__ITER}`
    });

    const res = http.post(
        "http://localhost:5010/api/courses/generate",
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    check(res, {
        "Accepted": (r) => r.status === 202,
    });
}