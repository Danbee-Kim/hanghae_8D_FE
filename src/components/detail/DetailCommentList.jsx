import { useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useRecoilState } from "recoil";
import styled from "styled-components";
import DetailComment from "components/detail/DetailComment";
import { getComments } from "api/detailApi";
import { commentRefState } from "state/atom";

const DetailCommentList = ({ process, articlesId }) => {
  const [refState, setRefState] = useRecoilState(commentRefState);
  const commentRef = useRef();
  const mountRef = useRef(false);

  const { isLoading, data: comments } = useQuery(
    "checkComments",
    () => getComments(articlesId),
    {
      onSuccess: (data) => {},
    }
  );

  const scrollToBottom = () => {
    if (commentRef.current) {
      commentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    mountRef.current = false;
    setRefState(false);
  }, []);

  useEffect(() => {
    mountRef.current && refState ? scrollToBottom() : (mountRef.current = true);
  }, [comments]);

  if (isLoading) return null;

  return (
    <StCommentList process={process}>
      {comments?.data.comments.map((comment) => (
        <li key={comment.commentsId}>
          <DetailComment
            commentVal={comment}
            isMyArticles={comments.data.isMyArticles}
            articlesId={articlesId}
          />
        </li>
      ))}
      <div ref={mountRef.current && refState ? commentRef : null}></div>
    </StCommentList>
  );
};

const StCommentList = styled.ul`
  padding: 0 35px 60px 35px;
  display: flex;
  flex-direction: column;
`;

export default DetailCommentList;
