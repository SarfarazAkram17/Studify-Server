require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Assignment 11 server is cooking");
});

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);

const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// verification middleware
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;

    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

const verifyTokenUid = (req, res, next) => {
  const uidFromToken = req.decoded?.uid;
  const uidFromQuery = req.query?.uid;

  if (uidFromToken !== uidFromQuery) {
    return res.status(403).send({ message: "Forbidden Access" });
  }

  next();
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or0q8ig.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const assignmentsCollection = client
      .db("Assignment-11")
      .collection("assignmentsCollection");

    const submissionsCollection = client
      .db("Assignment-11")
      .collection("submissionsCollection");

    // assignment
    app.get("/assignments", async (req, res) => {
      const { difficulty, search } = req.query;
      const query = {};

      if (difficulty) {
        query.difficulty = difficulty;
      }

      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      const result = await assignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/assignments/random", async (req, res) => {
      const randomAssignments = await assignmentsCollection
        .aggregate([{ $sample: { size: 6 } }])
        .toArray();

      res.send(randomAssignments);
    });

    // make this to make it secure
    app.get(
      "/myAssignments",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const query = { creator_email: req.query.email };

        const result = await assignmentsCollection.find(query).toArray();
        res.send(result);
      }
    );

    app.get("/assignments/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });

    app.post(
      "/assignments",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const assignment = req.body;
        const result = await assignmentsCollection.insertOne(assignment);
        res.send(result);
      }
    );

    app.put(
      "/assignments/:id",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const { email } = req.query;
        const { id } = req.params;
        const updatedAssignment = req.body;

        const query = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: updatedAssignment,
        };
        const options = { upsert: true };

        const assignment = await assignmentsCollection.findOne(query);

        if (assignment.creator_email !== email) {
          return res.send({
            message:
              "You are not able to update this assignment. You can only update your posted assignments",
          });
        }

        const result = await assignmentsCollection.updateOne(
          query,
          updatedDoc,
          options
        );
        res.send(result);
      }
    );

    app.delete(
      "/assignments/:id",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const { email } = req.query;
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };

        const assignment = await assignmentsCollection.findOne(query);

        if (assignment.creator_email !== email) {
          return res.send({
            message:
              "You are not able to delete this assignment. You can only delete your posted assignments",
          });
        }

        const result = await assignmentsCollection.deleteOne(query);
        res.send(result);
      }
    );

    // submission
    app.get(
      "/submissions",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const { status, email } = req.query;
        const query = {};

        if (status && status === "pending") {
          query.status = "pending";
        }

        if (email) {
          query.examinee_email = email;
        }

        const submissions = await submissionsCollection.find(query).toArray();

        for (let submission of submissions) {
          const { assignmentId } = submission;
          const query = { _id: new ObjectId(assignmentId) };
          const assignment = await assignmentsCollection.findOne(query, {
            projection: { title: 1, marks: 1 },
          });
          assignment && (submission.assignment_title = assignment.title);
          assignment && (submission.assignment_marks = assignment.marks);
        }

        res.send(submissions);
      }
    );

    app.get("/submissions/:id", async (req, res) => {
      const submission = await submissionsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      const { assignmentId } = submission;
      const query = { _id: new ObjectId(assignmentId) };
      const assignment = await assignmentsCollection.findOne(query, {
        projection: { title: 1, marks: 1 },
      });

      assignment && (submission.assignment_title = assignment.title);
      assignment && (submission.assignment_marks = assignment.marks);

      res.send(submission);
    });

    app.post(
      "/submissions",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const submission = req.body;
        const query = { _id: new ObjectId(submission.assignmentId) };

        const existing = await submissionsCollection.findOne({
          assignmentId: submission.assignmentId,
          examinee_email: submission.examinee_email,
        });

        const assignment = await assignmentsCollection.findOne(query, {
          projection: { creator_email: 1 },
        });

        if (assignment.creator_email === submission.examinee_email) {
          return res.send({
            message: "You can't able to submit your own assignments.",
          });
        }

        if (existing) {
          return res.send({
            message: "You have already submitted this assignment.",
          });
        }
        const result = await submissionsCollection.insertOne(submission);
        res.send(result);
      }
    );

    app.patch(
      "/submissions/:id",
      verifyFirebaseToken,
      verifyTokenUid,
      async (req, res) => {
        const { email } = req.query;
        const updatedSubmission = req.body;

        const query = { _id: new ObjectId(req.params.id) };
        const updatedDoc = {
          $set: {
            status: "completed",
            obtained_marks: updatedSubmission.obtainedMarks,
            feedback: updatedSubmission.feedback,
          },
        };

        const submission = await submissionsCollection.findOne(query);

        if (submission.status !== "pending") {
          return res.send({
            message: "This assignment has already been evaluated.",
          });
        }

        if (email === submission.examinee_email) {
          return res.send({
            message: "You are not able to evaluate your own assignment.",
          });
        }

        const result = await submissionsCollection.updateOne(query, updatedDoc);
        res.send(result);
      }
    );

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Assignment 11 server running on port ${port}`);
});
